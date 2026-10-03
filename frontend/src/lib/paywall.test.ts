import assert from "node:assert/strict";
import test from "node:test";

import { invoiceFrom, orderTokenFrom, paperFilePath, paperFileUrl, paperSkusInOrder } from "./paper-file.ts";
import { safeNextPath } from "./return-path.ts";

test("login return path stays on this site", () => {
  assert.equal(safeNextPath(null), "/dashboard");
  assert.equal(safeNextPath("/projects/biomedical-ai/gbm-signatures/"), "/projects/biomedical-ai/gbm-signatures/");
  assert.equal(safeNextPath("//evil.example/phish"), "/dashboard");
  assert.equal(safeNextPath("https://evil.example"), "/dashboard");
  assert.equal(safeNextPath("/\\evil"), "/dashboard");
});

test("full PDF url is the purchase endpoint, not a public file", () => {
  const path = paperFilePath("paper-gbm-signatures", "token-value");
  assert.equal(path, "/api/entitlements/papers/paper-gbm-signatures/file/?access=token-value");
  assert.equal(path.includes("/papers/gene-co-expression"), false);
  assert.equal(
    paperFileUrl("paper-gbm-signatures", "token-value", "https://scientificresearchers.org", true),
    "https://scientificresearchers.org/api/entitlements/papers/paper-gbm-signatures/file/?access=token-value&download=1",
  );
});

test("checkout confirmation reads the paper sku and order token", () => {
  const known = new Set(["paper-gbm-signatures"]);
  const payload = {
    token: "order-token-123456",
    invoiceNumber: "INV-9",
    items: [
      { id: "paper-gbm-signatures" },
      { id: "sub-researcher-monthly" },
    ],
  };
  assert.equal(orderTokenFrom(payload), "order-token-123456");
  assert.equal(invoiceFrom(payload), "INV-9");
  assert.deepEqual(paperSkusInOrder(payload, known), ["paper-gbm-signatures"]);
  assert.equal(orderTokenFrom({ items: [] }), "");
});
