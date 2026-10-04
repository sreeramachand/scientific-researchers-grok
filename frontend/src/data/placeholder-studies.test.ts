import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { projectGroups, projectsMore } from "./nav.ts";
import { papers } from "./papers.ts";
import { placeholderStudies } from "./placeholder-studies.ts";
import { searchPapers } from "../lib/paper-search.ts";

const previousMenu = [
  {
    label: "Biomedical AI",
    href: "/projects/biomedical-ai",
    items: [
      { label: "Nilearn image paper", href: "/projects/biomedical-ai/nilearn-image-paper" },
      { label: "GBM co-expression networks", href: "/projects/biomedical-ai/gbm-signatures" },
    ],
  },
  {
    label: "Visual",
    href: "/projects/visual",
    items: [
      { label: "Uveal melanoma", href: "/projects/visual/uveal-melanoma" },
      { label: "Diabetic retinopathy", href: "/projects/visual/diabetic-retinopathy" },
    ],
  },
  {
    label: "Cancer",
    href: "/projects/cancer",
    items: [
      { label: "Lung paper", href: "/projects/cancer/lung-paper" },
      { label: "Colon cancer paper", href: "/projects/cancer/colon-cancer-paper" },
    ],
  },
];

test("the projects dropdown restores the previous placeholder studies and keeps More", () => {
  assert.deepEqual(projectGroups, previousMenu);
  assert.deepEqual(projectsMore, { label: "More", href: "/projects" });
  assert.deepEqual(
    placeholderStudies.map((study) => study.label),
    [
      "Nilearn image paper",
      "Uveal melanoma",
      "Diabetic retinopathy",
      "Lung paper",
      "Colon cancer paper",
    ],
  );
});

test("placeholder studies are not published papers", () => {
  assert.deepEqual(papers.map((paper) => paper.slug), ["gbm-signatures"]);
  for (const study of placeholderStudies) {
    assert.equal(papers.some((paper) => paper.slug === study.slug), false);
    assert.deepEqual(searchPapers(papers, study.label), []);
  }
  assert.equal(searchPapers(papers, "signed-laplacian")[0]?.slug, "gbm-signatures");
});

test("the LaTeX submission control is on the dashboard and not on public project pages", () => {
  const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
  const dashboard = read("../pages/dashboard.astro");
  const projects = read("../pages/projects/index.astro");
  const landing = read("../pages/index.astro");
  assert.equal(dashboard.includes('id="add-project"'), true);
  assert.equal(dashboard.includes('id="projects-empty"'), true);
  assert.equal(dashboard.includes('id="latex-form"'), true);
  assert.equal(projects.includes("add-project"), false);
  assert.equal(projects.includes("latex-form"), false);
  assert.equal(projects.includes("projects-empty"), false);
  assert.equal(landing.includes("add-project"), false);
  assert.equal(landing.includes("latex-form"), false);
});
