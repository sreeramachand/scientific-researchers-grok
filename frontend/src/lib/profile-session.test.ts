import assert from "node:assert/strict";
import test from "node:test";

import { mergeNeonAccount, profileFromSave, usernameFieldRejected, type StoredProfile } from "./profile-session.ts";

const saved: StoredProfile = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada Lovelace",
  username: "ada",
  provider: "google",
};

test("get-session uses the user record and keeps a username Neon did not return", () => {
  const account = mergeNeonAccount(
    {
      session: { id: "session-1", userId: "user-1" },
      user: { id: "user-1", email: "ada@example.com", name: "Ada Lovelace" },
    },
    { ...saved, username: "countess.ada", name: "Ada Lovelace" },
  );
  assert.equal(account?.username, "countess.ada");
  assert.equal(account?.name, "Ada Lovelace");
  assert.equal(account?.provider, "google");
  assert.equal(account?.id, "user-1");
});

test("a session record without a user does not invent a replacement profile", () => {
  assert.equal(mergeNeonAccount({ session: { id: "session-1", userId: "user-1" } }, saved), null);
  assert.equal(mergeNeonAccount(null, saved), null);
});

test("a username returned by Neon replaces the stored one, including after a rename", () => {
  const account = mergeNeonAccount(
    {
      session: { id: "session-1" },
      user: { id: "user-1", email: "ada@example.com", name: "Augusta Ada", username: "augusta" },
    },
    saved,
  );
  assert.equal(account?.name, "Augusta Ada");
  assert.equal(account?.username, "augusta");
});

test("another account does not inherit the previous username", () => {
  const account = mergeNeonAccount(
    {
      user: { id: "user-2", email: "grace@example.com", name: "Grace Hopper" },
    },
    saved,
  );
  assert.equal(account?.username, "grace.hopper");
  assert.equal(account?.email, "grace@example.com");
});

test("a failed profile save does not change the stored name or username", () => {
  assert.throws(() => profileFromSave(saved, { name: "Ada Lovelace", username: "  " }), /Username is required/);
  assert.throws(() => profileFromSave(saved, { name: " ", username: "ada" }), /Display name is required/);
  assert.equal(saved.username, "ada");
  assert.equal(saved.name, "Ada Lovelace");
  assert.deepEqual(profileFromSave(saved, { name: " Augusta Ada ", username: " augusta " }), {
    ...saved,
    name: "Augusta Ada",
    username: "augusta",
  });
  assert.equal(usernameFieldRejected("username is not allowed to be set"), true);
  assert.equal(usernameFieldRejected("Username is already taken"), false);
});
