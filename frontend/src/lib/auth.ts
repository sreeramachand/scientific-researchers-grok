export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  image?: string;
  provider: "demo" | "email" | "google";
};

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
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (data as { message?: string }).message ??
      (data as { error?: string }).error ??
      "Authentication request failed.";
    throw new Error(message);
  }
  return data;
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

export async function getSession(): Promise<AuthUser | null> {
  if (neonUrl()) {
    try {
      const data = (await neonJson("/get-session", { method: "GET" })) as Record<string, unknown>;
      if (!data || data.session == null && data.user == null) return null;
      const session = (data.session ?? data) as Record<string, unknown>;
      const user = mapNeonUser((session.user as Record<string, unknown>) ?? session);
      writeSession(user);
      return user;
    } catch {
      return readSession();
    }
  }
  return readSession();
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
  const user: AuthUser = {
    id: crypto.randomUUID(),
    name: input.name,
    username: input.username,
    email: input.email,
    provider: "demo",
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
    const user = mapNeonUser(data);
    writeSession(user);
    return user;
  }
  const existing = readSession();
  if (existing && existing.email === input.email) return existing;
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
export async function signInWithGoogle(): Promise<string | null> {
  if (neonUrl()) {
    const data = await neonJson("/sign-in/social", {
      method: "POST",
      body: JSON.stringify({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
      }),
    });
    return googleRedirectUrl(data);
  }
  const user: AuthUser = {
    id: "demo-google",
    name: "Alex Rivera",
    username: "alex.rivera",
    email: "alex.rivera@gmail.com",
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

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  if (input.newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  if (neonUrl()) {
    await neonJson("/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return;
  }
  if (!readSession()) throw new Error("Sign in to change your password.");
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
