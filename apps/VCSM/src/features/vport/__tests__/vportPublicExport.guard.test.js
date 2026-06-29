/**
 * Export-surface guard — vport.public migration barrel
 *
 * TICKET-VPORT-UPDATE-EXPORT-001 (V03A-H1):
 * The bare, ownership-unverified `updateVport` DAL (a direct UPDATE on
 * vport.profiles keyed only by a caller-supplied vportId, auth-only via
 * requireUser) was a latent gate-less write surface with zero production
 * callers. It was removed from the DAL and de-exported from the migration
 * barrel. This guard ensures the export never silently returns.
 *
 * Source-assertion only — no behavioral coverage.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const featureDir = join(currentDir, ".."); // features/vport

const barrelSrc = readFileSync(join(featureDir, "vport.public.js"), "utf8");
const coreDalSrc = readFileSync(join(featureDir, "dal", "vport.core.dal.js"), "utf8");

describe("vport.public export surface — V03A-H1 removal guard", () => {
  it("does NOT re-export updateVport from the migration barrel", () => {
    expect(barrelSrc).not.toMatch(/\bupdateVport\b/);
  });

  it("does NOT define the bare updateVport function in vport.core.dal", () => {
    expect(coreDalSrc).not.toMatch(/\bexport\s+async\s+function\s+updateVport\b/);
    expect(coreDalSrc).not.toMatch(/\bupdateVport\b/);
  });
});
