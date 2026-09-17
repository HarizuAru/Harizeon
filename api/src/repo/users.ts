import type { Queryable } from "../db";
import { hashPassword, validatePasswordPolicy } from "../lib/password";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  email_verified_at: string | null;
  mfa_secret: string | null;
  last_login_at: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
};

export async function createUser(
  db: Queryable,
  input: { email: string; password: string; name?: string; locale?: string },
): Promise<UserRow> {
  const { ok, reason } = validatePasswordPolicy(input.password);
  if (!ok) throw new Error(reason);

  const passwordHash = await hashPassword(input.password);
  const res = await db.query<UserRow>(
    `INSERT INTO users (email, password_hash, name, locale)
     VALUES ($1,$2,$3,$4)
     RETURNING id, email, password_hash, name, email_verified_at, mfa_secret, last_login_at, locale, created_at, updated_at`,
    [input.email, passwordHash, input.name ?? null, input.locale ?? "en"],
  );
  return res.rows[0];
}

export async function findUserByEmail(db: Queryable, email: string): Promise<UserRow | null> {
  const res = await db.query<UserRow>(
    `SELECT id, email, password_hash, name, email_verified_at, mfa_secret, last_login_at, locale, created_at, updated_at
     FROM users WHERE email = $1`,
    [email],
  );
  return res.rows[0] ?? null;
}

export async function updateUserPassword(db: Queryable, userId: string, newPassword: string): Promise<void> {
  const { ok, reason } = validatePasswordPolicy(newPassword);
  if (!ok) throw new Error(reason);
  const hash = await hashPassword(newPassword);
  await db.query(
    `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`,
    [userId, hash],
  );
}

export async function setEmailVerified(db: Queryable, userId: string): Promise<void> {
  await db.query(
    `UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1`,
    [userId],
  );
}

export async function updateLastLogin(db: Queryable, userId: string): Promise<void> {
  await db.query(
    `UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`,
    [userId],
  );
}