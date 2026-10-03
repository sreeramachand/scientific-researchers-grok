import { userFromNeonSession } from "./google-callback.ts";

export type StoredProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  image?: string;
  provider: "demo" | "email" | "google";
};

function userRow(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const session = record.session;
  const nested =
    session && typeof session === "object" ? (session as Record<string, unknown>).user : undefined;
  const user = record.user ?? nested;
  if (!user || typeof user !== "object") return null;
  return user as Record<string, unknown>;
}

function sameAccount(previous: StoredProfile, id: string, email: string): boolean {
  return previous.id === id || previous.email.toLowerCase() === email.toLowerCase();
}

/**
 * Build the signed-in account from a Neon get-session body.
 * The session record is not the user. A username saved in this browser stays
 * when Neon does not return one for the same account.
 */
export function mergeNeonAccount(payload: unknown, previous: StoredProfile | null): StoredProfile | null {
  const profile = userFromNeonSession(payload);
  if (!profile) return null;
  const explicit = userRow(payload)?.username;
  const serverUsername = typeof explicit === "string" ? explicit.trim() : "";
  const same = previous != null && sameAccount(previous, profile.id, profile.email);
  const username =
    serverUsername ||
    (same ? previous.username.trim() : "") ||
    profile.name.toLowerCase().replace(/\s+/g, ".");
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    username,
    image: profile.image ?? (same ? previous.image : undefined),
    provider: same ? previous.provider : "email",
  };
}

/** Neon rejects a username field that the project has not enabled. */
export function usernameFieldRejected(message: string): boolean {
  return /username/i.test(message) && /not allowed|cannot be set|unknown field|unrecognized/i.test(message);
}

/** Fields written only after the profile request succeeds. */
export function profileFromSave(current: StoredProfile, input: { name: string; username: string }): StoredProfile {
  const name = input.name.trim();
  const username = input.username.trim();
  if (!name) throw new Error("Display name is required.");
  if (!username) throw new Error("Username is required.");
  return { ...current, name, username };
}
