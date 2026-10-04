import assert from "node:assert/strict";
import test from "node:test";

import { papers, type Paper } from "../data/papers.ts";
import { searchPapers } from "./paper-search.ts";

const draft: Paper = {
  ...papers[0],
  slug: "draft-note",
  title: "Unpublished note",
  authors: "Hidden Author",
  abstract: "xylophone-quarantine belongs only to this draft",
  keywords: ["signed-laplacian", "xylophone-quarantine"],
  published: false,
};

test("the published database is the glioblastoma paper", () => {
  assert.deepEqual(papers.map((paper) => paper.slug), ["gbm-signatures"]);
  assert.equal(papers[0].published, true);
  assert.equal(papers[0].sku, "paper-gbm-signatures");
});

test("search matches title, authors, abstract, and keywords", () => {
  const catalog = [...papers, draft];
  assert.equal(searchPapers(catalog, "Glioblastoma Multiforme")[0]?.slug, "gbm-signatures");
  assert.equal(searchPapers(catalog, "SreeRamachandrarao")[0]?.slug, "gbm-signatures");
  assert.equal(searchPapers(catalog, "Ramsey")[0]?.slug, "gbm-signatures");
  assert.equal(searchPapers(catalog, "signed-laplacian")[0]?.slug, "gbm-signatures");
});

test("a nonsense query and an unpublished draft are not results", () => {
  const catalog = [...papers, draft];
  assert.deepEqual(searchPapers(catalog, "xylophone-quarantine"), []);
  assert.deepEqual(searchPapers(catalog, "Hidden Author"), []);
  assert.equal(searchPapers(catalog, "   ").length, 1);
});
