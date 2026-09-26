import { config } from "../config";

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Transactional email via the Resend HTTP API (no SDK dependency).
 *
 * Unconfigured: development logs the message (so onboarding still works);
 * production throws so the caller can report the failure honestly — a security
 * product must never silently drop its alert mail (§08).
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = config.HARIZEON_EMAIL_API_KEY;
  if (!apiKey) {
    if (config.NODE_ENV !== "production") {
      console.log("[email:dev]", { to: payload.to, subject: payload.subject });
      return;
    }
    throw new Error("Email provider not configured (HARIZEON_EMAIL_API_KEY is unset)");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: config.HARIZEON_EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      ...(payload.html ? { html: payload.html } : {}),
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    // Never echo the body: it can contain account details on auth errors.
    throw new Error(`Email provider rejected the message (HTTP ${res.status})`);
  }
}

/**
 * Build a verification/reset URL for the console.
 */
export function buildAuthUrl(path: string, token: string): string {
  const base = config.PUBLIC_API_BASE.replace(/\/+$/, "");
  return `${base}${path}?token=${token}`;
}
