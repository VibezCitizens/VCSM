# SENTRY COMPLIANCE REPORT

**Application Scope:** VCSM
**Review Reason:** CEREBRO-directed verification of `vcsm.profiles.architecture.md`
**Architecture Contract:** `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
**Boundary Contract:** `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
**Date:** 2026-05-22
**Reviewer:** SENTRY
**Status:** CONTRACT VIOLATION

---

## BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|:---:|:---:|:---:|---|
| apps/VCSM | YES | NO (read-only audit) | NO | All inspection confined to VCSM |
| apps/wentrex | NO | NO | NO | Not in scope |
| apps/Traffic | NO | NO | NO | Not in scope |
| engines | NO (consumers reviewed) | NO | NO | Engine consumers inspected from VCSM side only |

---

## ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| DAL layer responsibility | DRIFT | MAJOR DRIFT | `fetchPostsForActor.dal.js` performs business orchestration (author resolution, kind dispatch, multi-schema joins) |
| Controller layer responsibility | DRIFT | MAJOR DRIFT | `checkActorOwnership.controller.js` delegates ownership logic to DAL; `upsertVportServices.controller.js` omits ownership check |
| Layer dependency direction | DRIFT | CONTRACT VIOLATION | `getActorPosts.controller.js` imports `PostModel` from `screens/views/tabs/post/models/` — controller depends on screen-layer file |
| Model layer placement | DRIFT | MAJOR DRIFT | PostModel lives inside `screens/views/tabs/post/models/` — belongs at feature-root `model/` |
| Adapter naming | DRIFT | MODERATE DRIFT | 3 adapter files use `.jsx.adapter.js` and `.js.adapter.js` double-extension patterns |
| Feature boundary (post data) | DRIFT | MAJOR DRIFT | Profiles owns two post-reading DALs that should belong to `post` feature; consumed directly, not via post.adapter |
| Duplicate controller registration | DRIFT | MODERATE DRIFT | Re-export controller at `screens/.../post/controllers/getActorPosts.controller.js` |
| Dead structure | DRIFT | MINOR DRIFT | Empty `dal/` dir in `screens/views/tabs/post/dal/` |
| Engine consumption | PASS | NONE | `@hydration`, `@reviews`, `@portfolio` consumed via correct re-export wrappers |
| Screen layer purity | PASS | NONE | Screens delegate to hooks; no direct DAL access confirmed in screen files |

---

## ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| upsertVportRate ownership | PASS | LOW | Calls `assertActorOwnsVportActorController()` ✓ |
| submitFuelPriceSuggestion ownership (owner path) | PASS | LOW | Explicit identity comparison on owner path ✓ |
| upsertVportServices ownership | FAIL | HIGH | No controller-level check — trusts RLS only |
| checkActorOwnership placement | FAIL | HIGH | Ownership semantic in DAL, not controller |
| Profile view ownership gate | PARTIAL | MEDIUM | Client-side gate in useProfileGate.js; no server-side controller verification |

---

## IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| `/profile/:actorId` URL | FAIL | HIGH | Raw UUID in public URL — should be slug-based |
| `/actor/:actorId/dashboard/*` URLs | PARTIAL | MEDIUM | Dashboard routes guarded by OwnerOnlyDashboardGuard; UUID in URL is internal-facing but still exposed |
| `actorId` + `kind` usage | PASS | LOW | Internal hooks use correct actor-based surface |
| `profileId` / `vportId` exposure | PASS | LOW | Not exposed through public hooks; confirmed in profiles.adapter.js |

---

## ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| @hydration consumption | PASS | NONE | Via `@/state/actors/` re-export wrappers — acceptable |
| @reviews consumption | PASS | NONE | Via adapter boundary |
| @portfolio consumption | PASS | NONE | Via adapter boundary |
| Engine→app direction | PASS | NONE | No evidence of engines importing profiles-specific logic |

---

## NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| Native parity declared | N/A | N/A | Source document declares native parity N/A for profiles module |

---

## SENTRY FINDINGS

---

### SENTRY FINDING — SF-001

- **Finding ID:** SF-001
- **Location:** `apps/VCSM/src/features/profiles/controller/post/getActorPosts.controller.js`
- **Drift Level:** CONTRACT VIOLATION
- **Severity:** CRITICAL
- **Contract Violated:** Architecture Contract (Layer Dependency Direction)
- **Current behavior:** The controller imports `PostModel` from `@/features/profiles/screens/views/tabs/post/models/post.model` — a path inside the `screens/` layer. A controller is depending downward on a screen-layer file.
  ```js
  import { PostModel } from "@/features/profiles/screens/views/tabs/post/models/post.model"
  ```
- **Expected behavior:** Models must live at the feature-root `model/` path or in the `kinds/*/model/` hierarchy — never inside `screens/`. The dependency direction is: DAL → Model → Controller → Hook → Screen. A controller must never depend on a screen-layer file.
- **Risk:** Layer inversion creates a circular coupling risk between the controller and screen layers. Refactoring the screen tree would break the controller. Reusability of `PostModel` is hidden behind a screen-layer path.
- **Recommended correction:** Move `post.model.js` from `screens/views/tabs/post/models/` to `features/profiles/model/post/post.model.js`. Update the controller import to the feature-root path.
- **Architectural rationale:** The VCSM architecture contract mandates strict layer dependency direction. Controllers must only depend on DALs and Models at the feature root — never on screen-layer artifacts.

---

### SENTRY FINDING — SF-002

- **Finding ID:** SF-002
- **Location:** `apps/VCSM/src/features/profiles/controller/checkActorOwnership.controller.js` + `apps/VCSM/src/features/profiles/dal/checkActorOwnership.dal.js`
- **Drift Level:** MAJOR DRIFT
- **Severity:** HIGH
- **Contract Violated:** Architecture Contract (DAL Layer Responsibility), Actor Ownership Contract
- **Current behavior:** `checkActorOwnership.controller.js` is a hollow pass-through — it directly calls `checkActorOwnershipDAL` and returns the result. No business logic is added at the controller layer. The actual ownership semantic (does actor X own actor Y?) is answered inside the DAL, not the controller.
- **Expected behavior:** The DAL should only fetch the raw `actor_owners` row. The controller should receive the raw data and apply the ownership business rule — comparing the row against the caller's identity to produce an ownership verdict.
- **Risk:** Ownership logic in the DAL cannot be safely composed with other business rules. If the ownership check needs to be enriched (e.g., checking secondary ownership, admin override), the logic is buried in the DAL and cannot be reused cleanly.
- **Recommended correction:** DAL should `SELECT actor_id, user_id FROM vc.actor_owners WHERE actor_id = $actorId AND user_id = $userId`. Controller should receive the row and evaluate `row !== null` as the ownership verdict.
- **Architectural rationale:** DALs do raw data access. Controllers own business rules. Ownership determination is a business rule.

---

### SENTRY FINDING — SF-003

- **Finding ID:** SF-003
- **Location:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`
- **Drift Level:** MAJOR DRIFT
- **Severity:** HIGH
- **Contract Violated:** Architecture Contract (DAL Layer Responsibility)
- **Current behavior:** `fetchPostsForActor.dal.js` (262 lines) performs:
  1. Actor kind determination (user vs vport) — business orchestration
  2. Conditional profile fetch based on kind — business dispatch logic
  3. Multi-schema joins across `vc.posts`, `vc.post_media`, `vc.post_mentions`, `vc.actors`, `public.profiles`, `vport.profiles`
  4. Mention resolution with actor display data hydration — presentation concern
  5. Graceful error handling with non-fatal fallbacks — controller-level responsibility
- **Expected behavior:** A DAL file should perform exactly one database read or write per method. Author resolution, mention hydration, and actor kind dispatch belong in the Controller or a Model transform.
- **Risk:** This DAL is a hidden god-method performing controller-level orchestration. It is untestable at the unit level, cannot be partially consumed, and conflates six separate concerns into one file. The non-fatal error handling means failures are silently swallowed rather than surfaced to callers.
- **Recommended correction:** Split into atomic DALs: `readPostsByActorId.dal.js`, `readPostMediaByPostIds.dal.js`, `readPostMentionsByPostIds.dal.js`, `readActorAuthorsByIds.dal.js`. Move orchestration into `getActorPosts.controller.js`. Move presentation hydration into a PostModel transform.
- **Architectural rationale:** Architecture contract: DAL = raw DB access only. No business logic, no orchestration, no multi-step dispatch.

---

### SENTRY FINDING — SF-004

- **Finding ID:** SF-004
- **Location:** `apps/VCSM/src/features/profiles/dal/readActorPosts.dal.js` + `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`
- **Drift Level:** MAJOR DRIFT
- **Severity:** HIGH
- **Contract Violated:** Architecture Contract (feature ownership), Cross-Feature Boundary
- **Current behavior:** The profiles feature owns two DAL methods that both read `vc.posts` and `vc.post_media`:
  1. `readActorPosts.dal.js` — reads posts + calls `readPostMediaByPostIdsDAL`
  2. `fetchPostsForActor.dal.js` — reads posts + media + mentions + actor data
  Both are profiles-owned DALs reading tables that belong to the `post` feature's domain.
- **Expected behavior:** Post data reads should belong to the `post` feature and be consumed via `post.adapter` — the approved cross-feature access path. The profiles module should not own DAL methods that read `vc.posts` directly.
- **Risk:** Duplicate post read paths create inconsistent data shapes returned to the profile UI. Changes to the posts schema require updates in both profiles DALs. This is exactly the drift pattern that adapters prevent.
- **Recommended correction:** Move post data reads to `features/post/` as new dedicated DAL methods. Create an adapter method in `post.adapter.js` that profiles can call. Remove profiles-owned post DALs.
- **Architectural rationale:** One feature must not own DAL access to another feature's primary table. Cross-feature access goes through adapters.

---

### SENTRY FINDING — SF-005

- **Finding ID:** SF-005
- **Location:** `apps/VCSM/src/features/profiles/screens/views/tabs/post/controllers/getActorPosts.controller.js`
- **Drift Level:** MODERATE DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract (layer structure)
- **Current behavior:** A controller file exists inside the `screens/views/tabs/post/controllers/` path. This file only re-exports from `@/features/profiles/controller/post/getActorPosts.controller`. No logic is added — it is a pure re-export wrapper inside the screen layer.
- **Expected behavior:** Controllers live at the feature-root `controller/` path, never inside `screens/`. Re-exporting a controller from within the screen layer creates two valid import paths to the same module and erodes the layer separation.
- **Risk:** Two import paths to the same controller. Screen-layer callers may use the re-export path, making it appear as if the controller is a screen-layer artifact. Future developers may add logic to the re-export instead of the canonical controller.
- **Recommended correction:** Delete the re-export file. Update any callers that use the screen-layer path to import directly from `@/features/profiles/controller/post/getActorPosts.controller`.
- **Architectural rationale:** Controllers must not be re-exported from screen-layer subdirectories.

---

### SENTRY FINDING — SF-006

- **Finding ID:** SF-006
- **Location:** `apps/VCSM/src/features/profiles/adapters/kinds/vport/hooks/rates/useUpsertVportRate.js.adapter.js`, `adapters/kinds/vport/screens/rates/components/VportRateEditorCard.jsx.adapter.js`, `adapters/kinds/vport/screens/rates/view/VportRatesView.jsx.adapter.js`
- **Drift Level:** MODERATE DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract (file naming convention)
- **Current behavior:** Three adapter files use double-extension naming: `.js.adapter.js` and `.jsx.adapter.js`. These are not recognized naming conventions in the VCSM codebase.
- **Expected behavior:** Adapter files should be named `<topic>.adapter.js` only. Double extensions indicate the original file extension was preserved before `.adapter.js` was appended — a pattern from an incorrect renaming workflow.
- **Risk:** Linters, bundlers, and import resolution tools may misidentify these files. The pattern is not self-documenting and breaks naming consistency.
- **Recommended correction:** Rename to canonical patterns:
  - `useUpsertVportRate.adapter.js`
  - `VportRateEditorCard.adapter.js`
  - `VportRatesView.adapter.js`
  Update all import references.
- **Architectural rationale:** All adapter files must follow `<topic>.adapter.js` naming exactly.

---

## CACHE ARCHITECTURE WARNING

**Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js`
**Cache behavior:** TTL cache with 60-second lifetime. `invalidateRatesCache()` export exists.
**Risk:** Cache invalidation only covers rate reads. If a rate is upserted and the cache is not explicitly invalidated in the write controller, stale rates would be shown for up to 60 seconds.
**Severity:** MEDIUM
**Recommended correction:** Verify `upsertVportRate.controller.js` calls `invalidateRatesCache()` after every successful upsert. This is a contract requirement for all TTL caches at the DAL layer.

---

## FINAL SENTRY STATUS: CONTRACT VIOLATION

**Reason:** SF-001 is a direct Contract Violation — a controller depending on a screen-layer model file inverts the architecture dependency direction mandated by the VCSM architecture contract. SF-003 and SF-004 are Major Drift findings that represent sustained architecture violations requiring remediation before the profiles module can be considered architecturally sound.

---

## FOLLOW-UP REQUIRED: REQUIRED BEFORE RELEASE

| Finding | Priority | Action Required | Owner |
|---|---|---|---|
| SF-001 (controller→screen import) | P0 — BLOCKING | Move PostModel to feature-root model/; update import | App |
| SF-002 (ownership logic in DAL) | P1 | Refactor: DAL fetches row, controller evaluates ownership | App |
| SF-003 (god-method DAL) | P1 | Split into atomic DALs; move orchestration to controller | App |
| SF-004 (post DAL ownership) | P1 | Move post reads to post feature; use post.adapter | App |
| SF-005 (re-export controller in screens) | P2 | Delete re-export file; update callers | App |
| SF-006 (adapter naming violations) | P2 | Rename 3 files; update imports | LOGAN |
| Cache invalidation (rates) | P2 | Verify invalidateRatesCache() called on upsert | App |

**Handoffs required:** VENOM (VF-002, VF-004 confirm SF-003/SF-004 security implications), DB (RLS verification for owner-gated writes), LOGAN (naming violations, documentation)
