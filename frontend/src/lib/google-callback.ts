import { safeNextPath } from "./return-path.ts";

/** Query param Neon appends to callbackURL after Google. Must be sent back to get-session. */
export const GOOGLE_VERIFIER_PARAM = "neon_auth_session_verifier";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  invalid_code: "Google sign-in could not be completed. Try again.",
  state_mismatch: "Google sign-in expired. Try again.",
  state_not_found: "Google sign-in expired. Try again.",
  verification_not_found: "Google sign-in could not be verified. Try again.",
  unable_to_get_user_info: "Google did not return an account we can sign in.",
  email_not_found: "Google did not return an email address for this account.",
  signup_disabled: "Google sign-up is not available for this account.",
};

export function googleCallbackErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  const safe = code.trim().slice(0, 80);
  if (!/^[A-Za-z0-9_-]+$/.test(safe)) return "Google sign-in failed.";
  return ERROR_MESSAGES[safe.toLowerCase()] ?? `Google sign-in failed (${safe}).`;
}

export type GoogleCallbackResult =
  | { status: "error"; message: string; next: string }
  | { status: "verifier"; verifier: string; next: string }
  | { status: "none"; next: string };

/** What the browser should do with the URL Neon sent back after Google. */
export function readGoogleCallback(search: URLSearchParams, fallbackNext = "/dashboard"): GoogleCallbackResult {
  const next = safeNextPath(search.get("next"), fallbackNext);
  const message = googleCallbackErrorMessage(search.get("error"));
  if (message) return { status: "error", message, next };
  const verifier = search.get(GOOGLE_VERIFIER_PARAM)?.trim() ?? "";
  if (verifier) return { status: "verifier", verifier, next };
  return { status: "none", next };
}

export function googleSessionPath(verifier: string): string {
  return `/get-session?${new URLSearchParams({ [GOOGLE_VERIFIER_PARAM]: verifier }).toString()}`;
}

export type NeonProfile = {
  id: string;
  email: string;
  name: string;
  image?: string;
};

/** User object from Neon get-session. The session record itself is not an account. */
export function userFromNeonSession(payload: unknown): NeonProfile | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const session = record.session;
  const nested =
    session && typeof session === "object" ? (session as Record<string, unknown>).user : undefined;
  const user = record.user ?? nested;
  if (!user || typeof user !== "object") return null;
  const row = user as Record<string, unknown>;
  const email = typeof row.email === "string" ? row.email : "";
  if (!email.includes("@")) return null;
  const name = typeof row.name === "string" && row.name.trim() ? row.name.trim() : email.split("@")[0];
  return {
    id: String(row.id ?? email),
    email,
    name,
    image: typeof row.image === "string" ? row.image : undefined,
  };
}
