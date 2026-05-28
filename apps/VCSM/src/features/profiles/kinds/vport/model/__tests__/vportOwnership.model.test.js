/**
 * vportOwnership.model.test.js
 *
 * Contract regression coverage for deriveVportIsOwner.
 *
 * Key invariants:
 *   - Active actor must BE the profile actor to be owner
 *   - Account/user membership does NOT grant ownership
 *   - userId is never consulted — only actor IDs are compared
 *   - Null/undefined inputs always return false
 */

import { describe, it, expect } from "vitest";
import { deriveVportIsOwner } from "../vportOwnership.model";

const ACTOR_A = "actor-aaa-111";
const ACTOR_B = "actor-bbb-222";

describe("deriveVportIsOwner", () => {
  // ── Identity match ─────────────────────────────────────────────────────────

  it("returns true when viewerActorId equals profileActorId", () => {
    expect(deriveVportIsOwner({ viewerActorId: ACTOR_A, profileActorId: ACTOR_A })).toBe(true);
  });

  it("returns true for numeric-string IDs that stringify-equal", () => {
    expect(deriveVportIsOwner({ viewerActorId: 42, profileActorId: "42" })).toBe(true);
    expect(deriveVportIsOwner({ viewerActorId: "42", profileActorId: 42 })).toBe(true);
  });

  // ── Actor independence — different actor must never own ────────────────────

  it("returns false when viewerActorId differs from profileActorId", () => {
    expect(deriveVportIsOwner({ viewerActorId: ACTOR_A, profileActorId: ACTOR_B })).toBe(false);
  });

  it("returns false when viewer is a different actor on the same account (multi-actor account)", () => {
    // E.g. user has both a personal actor (ACTOR_A) and a vport actor (ACTOR_B).
    // Viewing the vport while acting as the personal actor must NOT grant ownership.
    const personalActor = "personal-actor-xyz";
    const vportActor   = "vport-actor-xyz";
    expect(deriveVportIsOwner({ viewerActorId: personalActor, profileActorId: vportActor })).toBe(false);
  });

  // ── Null / missing guard ───────────────────────────────────────────────────

  it("returns false when viewerActorId is null", () => {
    expect(deriveVportIsOwner({ viewerActorId: null, profileActorId: ACTOR_A })).toBe(false);
  });

  it("returns false when profileActorId is null", () => {
    expect(deriveVportIsOwner({ viewerActorId: ACTOR_A, profileActorId: null })).toBe(false);
  });

  it("returns false when both are null", () => {
    expect(deriveVportIsOwner({ viewerActorId: null, profileActorId: null })).toBe(false);
  });

  it("returns false when viewerActorId is undefined", () => {
    expect(deriveVportIsOwner({ viewerActorId: undefined, profileActorId: ACTOR_A })).toBe(false);
  });

  it("returns false when profileActorId is undefined", () => {
    expect(deriveVportIsOwner({ viewerActorId: ACTOR_A, profileActorId: undefined })).toBe(false);
  });

  it("returns false when both are undefined", () => {
    expect(deriveVportIsOwner({ viewerActorId: undefined, profileActorId: undefined })).toBe(false);
  });

  it("returns false when viewerActorId is empty string", () => {
    expect(deriveVportIsOwner({ viewerActorId: "", profileActorId: ACTOR_A })).toBe(false);
  });

  it("returns false when profileActorId is empty string", () => {
    expect(deriveVportIsOwner({ viewerActorId: ACTOR_A, profileActorId: "" })).toBe(false);
  });

  // ── Public visitor ─────────────────────────────────────────────────────────

  it("returns false for unauthenticated visitor (no viewerActorId)", () => {
    expect(deriveVportIsOwner({ viewerActorId: null, profileActorId: ACTOR_A })).toBe(false);
  });

  // ── userId is NOT consulted ────────────────────────────────────────────────

  it("ignores a userId field even if accidentally passed alongside actorIds", () => {
    // userId must have zero influence — only actorIds matter
    const result = deriveVportIsOwner({
      viewerActorId: ACTOR_A,
      profileActorId: ACTOR_B,
      userId: "same-user-id-for-both-actors", // irrelevant; should not grant ownership
    });
    expect(result).toBe(false);
  });
});
