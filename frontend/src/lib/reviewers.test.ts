import assert from "node:assert/strict";
import test from "node:test";

import { awards } from "../data/awards.ts";
import { isReviewer } from "./reviewers.ts";

test("reviewer accounts are the two named addresses", () => {
  assert.equal(isReviewer("asreera110@gmail.com"), true);
  assert.equal(isReviewer("ASREERA110@scientificml.net"), true);
  assert.equal(isReviewer("visitor@example.com"), false);
  assert.equal(isReviewer("asreera110@gmail.com.example"), false);
});

test("no placeholder awards are listed", () => {
  assert.deepEqual(awards, []);
});
