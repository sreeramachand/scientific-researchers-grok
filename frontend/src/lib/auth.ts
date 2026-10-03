import { safeNextPath } from "./return-path";
import {
  findLocalAccount,
  GoogleOnlyAccountError,
  isGoogleOnly,
  isGoogleOnlyAccountError,
  messageLooksLikeGoogleOnly,
  requestLocalPasswordReset,
  resetLocalPassword,
  saveLocalAccount,
  updateLocalPassword,
} from "./local-auth";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  image?: string;
  provider: "demo" | "email" | "google";
};

export { GoogleOnlyAccountError, isGoogleOnlyAccountError };

const STORAGE_KEY = "sr.auth.session";
const EVENT = "sr-auth-changed";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function onAuthChange(handler: () => void): () => void {
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function readSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function writeSession(user: AuthUser | null) {
  if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

function neonUrl(): string {
  return (import.meta.env.PUBLIC_NEON_AUTH_URL as string | undefined)?.trim() ?? "";
}

async function neonJson(path: string, init?: RequestInit) {
  const base = neonUrl().replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    code?: string;
  };
  if (!response.ok) {
    const message = data.message ?? data.error ?? "Authentication request failed.";
    const error = new Error(message) as Error & { code?: string };
    error.code = data.code;
    throw error;
  }
  return data as Record<string, unknown>;
}

function mapNeonUser(payload: Record<string, unknown>): AuthUser {
  const user = (payload.user ?? payload) as Record<string, unknown>;
  const email = String(user.email ?? "member@scientificresearchers.org");
  const name = String(user.name ?? user.displayName ?? email.split("@")[0]);
  return {
    id: String(user.id ?? email),
    name,
    username: String(user.username ?? name.toLowerCase().replace(/\s+/g, ".")),
    email,
    image: typeof user.image === "string" ? user.image : undefined,
    provider: user.provider === "google" ? "google" : "email",
  };
}

async function providerIds(): Promise<string[]> {
  const data = await neonJson("/list-accounts", { method: "GET" });
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { accounts?: unknown }).accounts)
      ? ((data as { accounts: unknown[] }).accounts)
      : [];
  return rows.map((row) => String((row as { providerId?: string }).providerId ?? ""));
}

async function withProviders(user: AuthUser): Promise<AuthUser> {
  try {
    const ids = await providerIds();
    const google = ids.includes("google");
    const email = ids.includes("credential");
    if (google && !email) user.provider = "google";
    else if (email) user.provider = "email";
  } catch {
    /* session user stands if linked accounts cannot be listed */
  }
  return user;
}

export async function getSession(): Promise<AuthUser | null> {
  if (neonUrl()) {
    try {
      const data = (await neonJson("/get-session", { method: "GET" })) as Record<string, unknown>;
      if (!data || (data.session == null && data.user == null)) return null;
      const session = (data.session ?? data) as Record<string, unknown>;
      const user = await withProviders(mapNeonUser((session.user as Record<string, unknown>) ?? session));
      writeSession(user);
      return user;
    } catch {
      return readSession();
    }
  }
  return readSession();
}

export async function canChangePassword(): Promise<boolean> {
  const session = readSession();
  if (!session) return false;
  if (neonUrl()) {
    try {
      const ids = await providerIds();
      if (ids.includes("credential")) return true;
      if (ids.includes("google")) return false;
    } catch {
      /* fall through to the stored session */
    }
  }
  const account = findLocalAccount(session.email);
  if (account && isGoogleOnly(account)) return false;
  return session.provider !== "google";
}

export async function signUp(input: {
  name: string;
  username: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  if (neonUrl()) {
    const data = (await neonJson("/sign-up/email", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: `${window.location.origin}/dashboard`,
      }),
    })) as Record<string, unknown>;
    const user = mapNeonUser(data);
    user.username = input.username;
    writeSession(user);
    return user;
  }
  if (input.password.length < 8) {
    throw new Error("Use at least 8 characters.");
  }
  const existing = findLocalAccount(input.email);
  if (existing && isGoogleOnly(existing)) {
    throw new GoogleOnlyAccountError("This email uses Google sign-in. Continue with Google.");
  }
  const account = saveLocalAccount({
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name,
    username: input.username,
    email: input.email,
    password: input.password,
    providers: ["email"],
  });
  const user: AuthUser = {
    id: account.id,
    name: account.name,
    username: account.username,
    email: account.email,
    provider: "email",
  };
  writeSession(user);
  return user;
}

export async function signIn(input: { email: string; password: string }): Promise<AuthUser> {
  if (neonUrl()) {
    const data = (await neonJson("/sign-in/email", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        callbackURL: `${window.location.origin}/dashboard`,
      }),
    })) as Record<string, unknown>;
    const user = await withProviders(mapNeonUser(data));
    writeSession(user);
    return user;
  }
  const account = findLocalAccount(input.email);
  if (account) {
    if (isGoogleOnly(account)) {
      throw new GoogleOnlyAccountError("This account uses Google sign-in. Continue with Google.");
    }
    if (account.password && account.password !== input.password) {
      throw new Error("The email or password is incorrect.");
    }
    if (account.password) {
      const user: AuthUser = {
        id: account.id,
        name: account.name,
        username: account.username,
        email: account.email,
        provider: "email",
      };
      writeSession(user);
      return user;
    }
  }
  const existing = readSession();
  if (existing && existing.email.toLowerCase() === input.email.trim().toLowerCase()) return existing;
  if (input.password.length < 8) {
    throw new Error("Use at least 8 characters, or create an account first.");
  }
  const user: AuthUser = {
    id: crypto.randomUUID(),
    name: input.email.split("@")[0] ?? "Member",
    username: (input.email.split("@")[0] ?? "member").replace(/[^a-z0-9._-]/gi, ""),
    email: input.email,
    provider: "demo",
  };
  writeSession(user);
  return user;
}

/** Absolute http(s) URL from Neon Auth `POST /sign-in/social` (`{ redirect, url }`). */
export function googleRedirectUrl(payload: unknown): string {
  const url =
    payload && typeof payload === "object" && "url" in payload
      ? (payload as { url?: unknown }).url
      : undefined;
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    throw new Error("Google sign-in did not return a redirect URL.");
  }
  return url;
}

/**
 * Starts Google sign-in.
 * With Neon Auth, returns the provider URL the browser must open.
 * Without it, stores a local demo session and returns null.
 */
export async function signInWithGoogle(nextPath = "/dashboard"): Promise<string | null> {
  const next = safeNextPath(nextPath);
  if (neonUrl()) {
    const data = await neonJson("/sign-in/social", {
      method: "POST",
      body: JSON.stringify({
        provider: "google",
        callbackURL: `${window.location.origin}${next}`,
      }),
    });
    return googleRedirectUrl(data);
  }
  const account = saveLocalAccount({
    id: "demo-google",
    name: "Alex Rivera",
    username: "alex.rivera",
    email: "alex.rivera@gmail.com",
    providers: ["google"],
  });
  const user: AuthUser = {
    id: account.id,
    name: account.name,
    username: account.username,
    email: account.email,
    provider: "google",
  };
  writeSession(user);
  return null;
}

export async function signOut(): Promise<void> {
  if (neonUrl()) {
    try {
      await neonJson("/sign-out", { method: "POST", body: JSON.stringify({}) });
    } catch {
      /* still clear local session */
    }
  }
  writeSession(null);
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!email.includes("@")) throw new Error("Enter a valid email address.");
  if (neonUrl()) {
    try {
      await neonJson("/request-password-reset", {
        method: "POST",
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });
    } catch (error) {
      const coded = error as Error & { code?: string };
      const detail = `${coded.message ?? ""} ${coded.code ?? ""}`;
      if (messageLooksLikeGoogleOnly(detail)) {
        throw new GoogleOnlyAccountError(
          "This account uses Google sign-in. Continue with Google. There is no password to reset.",
        );
      }
      throw error;
    }
    return;
  }
  requestLocalPasswordReset(email);
}

export async function resetPasswordWithToken(input: { token: string; newPassword: string }): Promise<void> {
  if (input.newPassword.length < 8) throw new Error("Use at least 8 characters.");
  if (!input.token) throw new Error("This reset link is invalid or has expired.");
  if (neonUrl()) {
    try {
      await neonJson("/reset-password", {
        method: "POST",
        body: JSON.stringify({
          newPassword: input.newPassword,
          token: input.token,
        }),
      });
    } catch (error) {
      const coded = error as Error & { code?: string };
      if (coded.code === "INVALID_TOKEN" || /invalid token/i.test(coded.message)) {
        throw new Error("This reset link is invalid or has expired.");
      }
      throw error;
    }
    return;
  }
  resetLocalPassword(input.token, input.newPassword);
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  if (input.newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  if (neonUrl()) {
    if (!(await canChangePassword())) {
      throw new GoogleOnlyAccountError("This account uses Google sign-in, so it has no password to change.");
    }
    await neonJson("/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return;
  }
  const session = readSession();
  if (!session) throw new Error("Sign in to change your password.");
  updateLocalPassword(session.email, input.currentPassword, input.newPassword);
}

export async function changeEmail(email: string): Promise<AuthUser> {
  if (!email.includes("@")) throw new Error("Enter a valid email address.");
  if (neonUrl()) {
    await neonJson("/change-email", {
      method: "POST",
      body: JSON.stringify({ newEmail: email }),
    });
  }
  const current = readSession();
  if (!current) throw new Error("Sign in to change your email.");
  const account = findLocalAccount(current.email);
  if (account) saveLocalAccount({ ...account, email });
  const next = { ...current, email };
  writeSession(next);
  return next;
}

export async function updateProfile(input: { name: string; username: string }): Promise<AuthUser> {
  if (!input.username.trim()) throw new Error("Username is required.");
  if (neonUrl()) {
    try {
      await neonJson("/update-user", {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch {
      /* local profile still updates for the UI */
    }
  }
  const current = readSession();
  if (!current) throw new Error("Sign in to update your profile.");
  const account = findLocalAccount(current.email);
  if (account) saveLocalAccount({ ...account, name: input.name, username: input.username });
  const next = { ...current, ...input };
  writeSession(next);
  return next;
}

export function requireAuth(redirectTo = "/login"): AuthUser | null {
  const user = readSession();
  if (!user) {
    const next = encodeURIComponent(window.location.pathname);
    window.location.replace(`${redirectTo}?next=${next}`);
    return null;
  }
  return user;
}
