import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { informationSessions, monthGrid, sessionOn, weekdayOf } from "./sessions.ts";

test("only the three Friday information sessions are on the calendar", () => {
  assert.deepEqual(
    informationSessions.map((session) => session.date),
    ["2026-11-20", "2026-12-18", "2027-01-22"],
  );
  for (const session of informationSessions) {
    assert.equal(weekdayOf(session.date), "Friday");
    assert.equal(session.time, "7:00–8:00 PM ET");
    assert.equal(sessionOn(session.date)?.id, session.id);
  }
  assert.equal(sessionOn("2026-11-21"), undefined);
  const november = monthGrid(2026, 11).map((cell) => cell.date);
  assert.equal(november.includes("2026-11-20"), true);
  assert.equal(monthGrid(2026, 12).some((cell) => cell.date === "2026-12-18"), true);
  assert.equal(monthGrid(2027, 1).some((cell) => cell.date === "2027-01-22"), true);
});

test("the public site source does not contain a Meet link", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const needle = ["meet", "google", "com"].join(".");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".ts") || entry.name.endsWith(".astro")) files.push(path);
    }
  };
  walk(root);
  const blob = files.map((path) => readFileSync(path, "utf8")).join("\n");
  assert.equal(blob.includes(needle), false);
});
