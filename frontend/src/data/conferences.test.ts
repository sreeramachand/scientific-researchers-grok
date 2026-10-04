import assert from "node:assert/strict";
import test from "node:test";

import { posterConferences } from "./conferences.ts";

const officialHosts = new Set([
  "www.iscb.org",
  "psb.stanford.edu",
  "eccb2026.org",
  "recomb.org",
  "incob.apbionet.org",
]);

test("poster links are official pages across the US, Europe, and Asia", () => {
  assert.ok(posterConferences.length >= 5);
  const regions = new Set(posterConferences.map((conference) => conference.region));
  assert.equal(regions.has("United States"), true);
  assert.equal(regions.has("Europe"), true);
  assert.equal(regions.has("Asia"), true);
  for (const conference of posterConferences) {
    const url = new URL(conference.href);
    assert.equal(url.protocol, "https:");
    assert.equal(officialHosts.has(url.hostname), true);
    assert.ok(conference.detail.length > 40);
  }
});
