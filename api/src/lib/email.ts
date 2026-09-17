import { config } from "../config";

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Email sender stub — real provider (Resend/SES) is W09.
 * In development, logs the email content; in production, throws if no provider is configured.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (config.NODE_ENV !== "production") {
    console.log("[email:dev]", { to: payload.to, subject: payload.subject });
    return;
  }
  // ponytail: real transactional provider (Resend/SES) wired in W09; prod must not silently drop mail.
  throw new Error("Email provider not configured");
}

/**
 * Build a verification/reset URL for the console.
 */
export function buildAuthUrl(path: string, token: string): string {
  const base = config.PUBLIC_API_BASE.replace(/\/+$/, "");
  return `${base}${path}?token=${token}`;
}