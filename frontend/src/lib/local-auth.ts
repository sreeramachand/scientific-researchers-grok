export const ACCOUNTS_KEY = "sr.auth.accounts";
export const RESETS_KEY = "sr.auth.password-resets";

const RESET_TTL_MS = 15 * 60 * 1000;

export type LocalProvider = "email" | "google";

export type LocalAccount = {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  providers: LocalProvider[];
};

type ResetRecord = {
  email: string;
  token: string;
  expiresAt: number;
};

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export class GoogleOnlyAccountError extends Error {
  readonly code = "google-only" as const;

  constructor(message = "This account uses Google sign-in. Continue with Google.") {
    super(message);
    this.name = "GoogleOnlyAccountError";
  }
}

export function isGoogleOnlyAccountError(error: unknown): boolean {
  return error instanceof Error && error.name === "GoogleOnlyAccountError";
}

/** Neon/Better Auth errors that mean the address has no email password. */
export function messageLooksLikeGoogleOnly(message: string): boolean {
  return /google|social provider|oauth|credential account not found|no password/i.test(message);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readJson<T>(store: KeyValueStore, key: string, fallback: T): T {
  const raw = store.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function browserStore(): KeyValueStore {
  if (typeof window === "undefined") {
    throw new Error("Local accounts are only available in the browser.");
  }
  return window.localStorage;
}

function readAccounts(store: KeyValueStore): LocalAccount[] {
  return readJson<LocalAccount[]>(store, ACCOUNTS_KEY, []);
}

function writeAccounts(store: KeyValueStore, rows: LocalAccount[]) {
  store.setItem(ACCOUNTS_KEY, JSON.stringify(rows));
}

function readResets(store: KeyValueStore): ResetRecord[] {
  return readJson<ResetRecord[]>(store, RESETS_KEY, []);
}

function writeResets(store: KeyValueStore, rows: ResetRecord[]) {
  store.setItem(RESETS_KEY, JSON.stringify(rows));
}

export function findLocalAccount(email: string, store: KeyValueStore = browserStore()): LocalAccount | null {
  const needle = normalizeEmail(email);
  return readAccounts(store).find((account) => account.email.toLowerCase() === needle) ?? null;
}

export function isGoogleOnly(account: LocalAccount): boolean {
  return account.providers.includes("google") && !account.password;
}

export function saveLocalAccount(account: LocalAccount, store: KeyValueStore = browserStore()): LocalAccount {
  const email = normalizeEmail(account.email);
  const next = { ...account, email };
  const rows = readAccounts(store).filter((row) => row.email.toLowerCase() !== email);
  rows.push(next);
  writeAccounts(store, rows);
  return next;
}

/**
 * Email accounts get a single-use reset token stored in this browser.
 * Google-only accounts throw instead of receiving a reset token.
 * Unknown addresses return quietly so the form does not reveal who is registered.
 */
export function requestLocalPasswordReset(
  email: string,
  store: KeyValueStore = browserStore(),
  now = Date.now(),
): void {
  const account = findLocalAccount(email, store);
  if (account && isGoogleOnly(account)) {
    throw new GoogleOnlyAccountError(
      "This account uses Google sign-in. Continue with Google. There is no password to reset.",
    );
  }
  const pending = readResets(store).filter((row) => row.expiresAt > now && row.email !== account?.email);
  if (account?.password) {
    pending.push({
      email: account.email,
      token: crypto.randomUUID().replace(/-/g, ""),
      expiresAt: now + RESET_TTL_MS,
    });
  }
  writeResets(store, pending);
}

export function resetTokenForEmail(email: string, store: KeyValueStore, now = Date.now()): string | null {
  const account = findLocalAccount(email, store);
  if (!account) return null;
  const row = readResets(store).find((item) => item.email === account.email && item.expiresAt > now);
  return row?.token ?? null;
}

export function resetLocalPassword(
  token: string,
  newPassword: string,
  store: KeyValueStore = browserStore(),
  now = Date.now(),
): void {
  if (newPassword.length < 8) {
    throw new Error("Use at least 8 characters.");
  }
  const pending = readResets(store);
  const record = pending.find((row) => row.token === token && row.expiresAt > now);
  if (!record) {
    throw new Error("This reset link is invalid or has expired.");
  }
  const account = findLocalAccount(record.email, store);
  if (!account || isGoogleOnly(account)) {
    throw new GoogleOnlyAccountError(
      "This account uses Google sign-in. Continue with Google. There is no password to reset.",
    );
  }
  saveLocalAccount({ ...account, password: newPassword }, store);
  writeResets(
    store,
    pending.filter((row) => row.token !== token),
  );
}

export function updateLocalPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
  store: KeyValueStore = browserStore(),
): "updated" | "unchanged" {
  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  const account = findLocalAccount(email, store);
  if (!account) return "unchanged";
  if (isGoogleOnly(account)) {
    throw new GoogleOnlyAccountError("This account uses Google sign-in, so it has no password to change.");
  }
  if (!account.password) return "unchanged";
  if (account.password !== currentPassword) {
    throw new Error("Current password is incorrect.");
  }
  saveLocalAccount({ ...account, password: newPassword }, store);
  return "updated";
}
