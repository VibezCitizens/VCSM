/**
 * Visibility-propagation guard — profile-view fetch + SEO gating
 *
 * TICKET-PROFILE-VIEW-GATE-FETCH-001 (V05A-M2):
 * The profile-content fetch and the SEO head-write previously ran regardless of
 * the already-correct visibility decision (`useProfileGate.canView`), so a denied
 * viewer fetched a private profile's bio/counts and `useActorSeoMeta` wrote that
 * bio into <head>. The fix propagates the existing `canViewContent` / `gate.canView`
 * signal: the query enables only on `canViewContent === true`, and the SEO call is
 * gated on `gate.canView` in both profile screens.
 *
 * Source-assertion only (no renderHook / RTL) — matches repo guard-test convention.
 * This guard fails if the fetch gate or the SEO gate ever regress.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const featureDir = join(currentDir, ".."); // features/profiles

const useProfileViewSrc = readFileSync(
  join(featureDir, "hooks", "useProfileView.js"),
  "utf8"
);
const citizenScreenSrc = readFileSync(
  join(featureDir, "screens", "views", "ActorProfileViewScreen.jsx"),
  "utf8"
);
const vportScreenSrc = readFileSync(
  join(featureDir, "kinds", "vport", "screens", "VportProfileViewScreen.jsx"),
  "utf8"
);

describe("profile-view visibility propagation — V05A-M2 guard", () => {
  it("useProfileView enables the query ONLY when canViewContent === true", () => {
    expect(useProfileViewSrc).toMatch(/canViewContent === true/);
    // The pre-fix permissive condition must never return.
    expect(useProfileViewSrc).not.toMatch(/canViewContent !== undefined/);
  });

  it("ActorProfileViewScreen gates the SEO call on gate.canView", () => {
    expect(citizenScreenSrc).toMatch(/useActorSeoMeta\(\s*gate\.canView\s*\?\s*profile\s*:\s*null/);
    // The pre-fix unconditional SEO write must never return.
    expect(citizenScreenSrc).not.toMatch(/useActorSeoMeta\(profile \?\? null\)/);
  });

  it("VportProfileViewScreen gates the SEO call (profile and publicDetails) on gate.canView", () => {
    expect(vportScreenSrc).toMatch(/useActorSeoMeta\(\s*gate\.canView\s*\?\s*profile\s*:\s*null/);
    expect(vportScreenSrc).toMatch(/gate\.canView\s*\?\s*publicDetails\s*:\s*null/);
    expect(vportScreenSrc).not.toMatch(/useActorSeoMeta\(profile \?\? null, publicDetails \?\? null\)/);
  });
});
