import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const indexSource = readFileSync(join(currentDir, "../index.js"), "utf8");

describe("gasprices public index Rule 9 boundary", () => {
  it("does not export DAL internals through the card barrel", () => {
    expect(indexSource).not.toMatch(/from\s+["']\.\/dal\//);
  });
});
