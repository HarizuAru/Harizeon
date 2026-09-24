"use server";

import { redirect } from "next/navigation";
import { apiBase, forwardSessionCookie, apiFetch, clearSessionCookie, DEMO_MODE } from "./api";
import { handleMockAuthPost } from "./mock-service";

export type ActionState = { error?: string } | null;

async function postJson(path: string, body: unknown, mockAllowed: boolean): Promise<{ res: Response; json: unknown }> {
  try {
    const res = await fetch(`${apiBase()}/v1${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    let json: unknown = {};
    try {
      json = await res.json();
    } catch {
      json = {};
    }
    return { res, json };
  } catch (e: unknown) {
    if (DEMO_MODE && mockAllowed) return handleMockAuthPost(path, body);
    throw e;
  }
}

function apiErrorMessage(json: unknown, fallback: string): string {
  const err = (json as { error?: { message?: string } }).error;
  return err?.message ?? fallback;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  let res: Response;
  let json: unknown;
  try {
    ({ res, json } = await postJson("/auth/login", { email, password }, true));
  } catch {
    return { error: "Cannot reach the API. Is it running?" };
  }
  if (!res.ok) return { error: apiErrorMessage(json, "Login failed") };
  if (!(await forwardSessionCookie(res))) return { error: "Login failed (no session issued)" };
  redirect("/dashboard");
}

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");
  const orgName = String(formData.get("orgName") ?? "");
  const orgSlug = String(formData.get("orgSlug") ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let res: Response;
  let json: unknown;
  try {
    ({ res, json } = await postJson("/auth/signup", { email, password, name, orgName, orgSlug }, true));
  } catch {
    return { error: "Cannot reach the API. Is it running?" };
  }
  if (!res.ok) return { error: apiErrorMessage(json, "Signup failed") };
  redirect("/login?created=1");
}

export async function logoutAction(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST", body: {} });
  } catch {
    // still clear the browser cookie below
  }
  await clearSessionCookie();
  redirect("/login");
}
