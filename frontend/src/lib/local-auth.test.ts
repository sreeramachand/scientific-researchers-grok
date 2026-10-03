import assert from "node:assert/strict";
import test from "node:test";

import {
  GoogleOnlyAccountError,
  requestLocalPasswordReset,
  resetLocalPassword,
  resetTokenForEmail,
  saveLocalAccount,
  type KeyValueStore,
} from "./local-auth.ts";

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

test("email account can request a reset, set a new password, and the old token dies", () => {
  const store = memoryStore();
  saveLocalAccount(
    {
      id: "user-1",
      name: "Ada Lovelace",
      username: "ada",
      email: "ada@example.com",
      password: "original-pass",
      providers: ["email"],
    },
    store,
  );

  requestLocalPasswordReset("Ada@Example.com", store);
  const token = resetTokenForEmail("ada@example.com", store);
  assert.ok(token);

  resetLocalPassword(token, "replacement-pass", store);
  assert.equal(resetTokenForEmail("ada@example.com", store), null);
  assert.throws(() => resetLocalPassword(token, "another-pass-1", store), /invalid or has expired/);

  const raw = store.getItem("sr.auth.accounts");
  assert.ok(raw?.includes("replacement-pass"));
  assert.equal(raw?.includes("original-pass"), false);
});

test("google-only accounts do not receive a reset token", () => {
  const store = memoryStore();
  saveLocalAccount(
    {
      id: "google-1",
      name: "Alex Rivera",
      username: "alex.rivera",
      email: "alex.rivera@gmail.com",
      providers: ["google"],
    },
    store,
  );

  assert.throws(() => requestLocalPasswordReset("alex.rivera@gmail.com", store), GoogleOnlyAccountError);
  assert.equal(resetTokenForEmail("alex.rivera@gmail.com", store), null);
});

test("unknown addresses do not get a reset link", () => {
  const store = memoryStore();
  requestLocalPasswordReset("missing@example.com", store);
  assert.equal(resetTokenForEmail("missing@example.com", store), null);
});
