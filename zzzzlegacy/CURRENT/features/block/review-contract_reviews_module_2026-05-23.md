# REVIEW-CONTRACT — Architecture Contract Compliance Check
**Target Module:** reviews  
**Scope:** `apps/VCSM/src/features/reviews/` + `engines/reviews/`  
**Date:** 2026-05-23  
**Status:** BLOCKED  
**Contract Reference:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`

---

## Contract Clause Verification

### §1 — Identity Contract

| Clause | Requirement | Status |
|---|---|---|
| §1.1 | Actor-based identity: `actorId` + `kind` | PASS — engine uses actorId throughout |
| §1.2 | Never scope by `profileId`, `vportId`, raw `userId` | PASS — not present in reviews module |
| §1.3 | Never expose `profileId` or `vportId` through public surfaces | PASS |
| §1.4 | Owner = Actor Owner, verified through `actor_owners` | **FAIL — BLOCKING** |

**§1.4 Violation Detail:**  
`apps/VCSM/src/features/reviews/setup.js:30-44` implements `isActorOwner` by querying `vc.actors` to confirm actor existence — not `vc.actor_owners` to confirm the session user's ownership. This directly violates §1.4. The contract states: "Owner always means Actor Owner — verified through `actor_owners`. There is no other ownership model."

---

### §2 — Screen Role Boundaries

Not applicable — reviews module has no screens. All UI owned by `@reviews` engine. **PASS by N/A.**

---

### §3 — Build Order Contract

`DAL → Model → Controller → Hook → Screen`

**Status:** PASS — Engine owns and respects build order. VCSM contributes only the `setup.js` wire-up, which is correctly pre-render.

---

### §4 — Import Rules

| Rule | Status |
|---|---|
| All cross-folder imports use `@/...` aliases | PASS — `setup.js` uses `@reviews` and `@/services/supabase/supabaseClient` |
| No relative `../../` chains | PASS |
| Cross-feature access via adapters only | PASS — engine exposes `src/adapters/index.js` as sole surface |

---

### §5 — DAL Rules

| Rule | Status |
|---|---|
| Always use explicit column lists | PASS — `REVIEW_COLUMNS` constant used; no `select('*')` |
| `select('*')` is banned | PASS — not present in any engine DAL |

---

### §6 — File Length Rule

All files under 300 lines. **PASS.**

---

### §7 — Language Rules

No TypeScript files. **PASS.**

---

## Contract Verdict

| Contract Area | Result |
|---|---|
| Identity (§1.1–1.3) | PASS |
| Identity (§1.4 — ownership model) | **FAIL — BLOCKING** |
| Screen boundaries | N/A — PASS |
| Build order | PASS |
| Import rules | PASS |
| DAL rules | PASS |
| File length | PASS |
| Language | PASS |

**Overall Status: BLOCKED**  
One critical contract violation: `isActorOwner` does not verify through `actor_owners`. Module cannot advance to VERIFIED until this is fixed and re-reviewed.
