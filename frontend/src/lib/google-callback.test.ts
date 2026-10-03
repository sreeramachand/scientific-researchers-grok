import assert from "node:assert/strict";
import test from "node:test";

import {
  googleCallbackErrorMessage,
  googleSessionPath,
  readGoogleCallback,
  userFromNeonSession,
} from "./google-callback.ts";

test("a Google callback verifier is kept with the requested next path", () => {
  const result = readGoogleCallback(
    new URLSearchParams({
      next: "/account",
      neon_auth_session_verifier: "verify-token",
    }),
  );
  assert.deepEqual(result, { status: "verifier", verifier: "verify-token", next: "/account" });
  assert.equal(googleSessionPath("verify-token"), "/get-session?neon_auth_session_verifier=verify-token");
});

test("a failed Google callback is a visible error and does not invent a session", () => {
  const result = readGoogleCallback(new URLSearchParams({ error: "access_denied", next: "/dashboard" }));
  assert.equal(result.status, "error");
  if (result.status !== "error") return;
  assert.equal(result.message, "Google sign-in was cancelled.");
  assert.equal(result.next, "/dashboard");
  assert.equal(googleCallbackErrorMessage("not a code"), "Google sign-in failed.");
});

test("callback user comes from the Neon user, not the session id", () => {
  const profile = userFromNeonSession({
    session: { id: "session-1", userId: "user-1" },
    user: { id: "user-1", email: "ada@example.com", name: "Ada Lovelace", image: "https://example.com/a.png" },
  });
  assert.deepEqual(profile, {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada Lovelace",
    image: "https://example.com/a.png",
  });
  assert.equal(userFromNeonSession({ session: { id: "session-1" } }), null);
  assert.equal(userFromNeonSession(null), null);
});

test("an unsafe next path falls back to the dashboard", () => {
  const result = readGoogleCallback(new URLSearchParams({ next: "https://evil.example/phish" }));
  assert.deepEqual(result, { status: "none", next: "/dashboard" });
});
