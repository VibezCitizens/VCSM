# CONTRACT REVIEW REPORT

**Date:** 2026-06-06
**Reviewer:** CONTRACT REVIEWER (Blue Team)
**Target:** apps/VCSM/src/features/feed/
**Application Scope:** VCSM

---

## Review Metadata

**Contracts Reviewed:**
- Platform/02-layer-responsibilities.md — Layer definitions and responsibilities
- Platform/03-dependency-rules.md — Dependency direction and isolation
- Platform/05-app-architecture.md — App structure and build rules
- System/01-boundary-core.md — Project boundary isolation
- System/04-actor-core-rule.md — Single-source actor architecture
- System/05-actor-ten-rules.md — 10 actor architecture rules
- CLAUDE.md (app-level) — Layer build order, adapter boundary rules, import rules
- review-contract/05-rules-verification.md — Compliance checklist (all 14 rules)

**Files Reviewed:**
- apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx (246 lines)
- apps/VCSM/src/features/feed/hooks/useCentralFeed.js (292 lines)
- apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js (280 lines)
- apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js (177 lines)
- apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js (108 lines)
- apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js (37 lines)
- apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js (14 lines)
- apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js (43 lines)
- apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js (26 lines)
- apps/VCSM/src/features/feed/model/normalizeFeedRows.model.js (104 lines)
- apps/VCSM/src/features/feed/model/buildMentionMaps.model.js (excerpt)
- apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js (1 line)

**Cross-references:** ARCHITECT run 2026-06-06 (45-file inventory); ELEKTRA run 2026-06-06 (security chain traces)

---

## Compliance Checklist

| Rule | Status | Details |
|---|---|---|
| Import path — @/ only, no ../../ | PASS | No relative imports found (grep confirmed) |
| Module build order DAL→Model→Controller→Hook→Component→Screen | PASS | ARCHITECT confirms correct layering |
| DAL must not enforce permissions | PASS | All DALs query only; no permission checks found |
| Models must be pure | PASS | normalizeFeedRows, feedRowVisibility, feedBlockVisibility — no side effects |
| Controllers own business logic | FAIL | listActorPosts discards viewerActorId; feedWelcomeCard has no ownership assertion |
| Hooks orchestrate data for components | PASS | useCentralFeed, useCentralFeedActions delegate to hooks and controllers |
| Components/screens must be UI-focused (UI purity) | FAIL | CentralFeedScreen:63 computes adult flag business rule |
| File size max 300 lines | WARNING | useCentralFeed:292 lines, useCentralFeedActions:280 lines |
| Controller fan-out max 5 collaborators | WARNING | fetchFeedPage.pipeline.js calls 10+ DALs (pipeline, not controller, but orchestrates as one) |
| File naming conventions | PASS | All files follow .dal.js / .model.js / .controller.js / use*.js / .adapter.js / .pipeline.js conventions |
| Folder depth max 3 levels below feature root | PASS | Deepest path: feed/adapters/hooks/ — 2 levels |
| Cross-feature boundary — adapters only | FAIL | CentralFeedScreen imports profiles CSS directly; listActorPosts SSOT not adapter-exposed |
| Dependency direction apps→engines→shared | PASS | @hydration, @debuggers consumption confirmed (app → engine direction) |
| Identity surface — actorId + kind only | PASS | profileId/vportId used as DB FKs only; identity surface uses actorId+kind |
| Adapter rule — no DAL/model/controller exports | FAIL | useFeed.adapter.js frozen on legacy hook; listActorPosts not exposed via adapter |
| select('*') banned | PASS | grep confirmed: no select('*') in any feed DAL |
| Actor core rule — only identityContext owns actor state | PASS | CentralFeedScreen correctly derives from useIdentity() |
| Actor rule 4 — query keys include actorId | PASS | queryKeys.centralFeed(viewerActorId, realmId) confirmed |

---

## Critical Violations

None.

---

## High Violations

---

**VIOLATION CRV-2026-06-06-001**
**Rule:** Cross-feature boundary — features may only import other features through adapters
**Severity:** HIGH
**File:** apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx:31

```js
import '@/features/profiles/styles/profiles-modern.css'
```

**Issue:** The central feed screen imports a CSS file directly from the `profiles` feature's internal `styles/` directory. This is not an adapter-mediated import. The feed feature now has a hard compile-time dependency on the profiles feature's internal CSS. A refactor or rename of `profiles-modern.css` breaks the feed screen without any adapter warning.

**Contract:** "Features may only import other features through adapters." CSS files are not exempt from this rule — they are internal feature assets.

**Fix:** Either (a) move the shared styles to `shared/` or `apps/VCSM/src/styles/` where they belong to no feature; or (b) export the CSS import from a profiles adapter entry point if the styles are legitimately profiles-owned. If the styles are feed-specific, move them into `features/feed/styles/`.

**Route:** IRONMAN

---

**VIOLATION CRV-2026-06-06-002**
**Rule:** Adapter rule — adapters must expose the current canonical implementation
**Severity:** HIGH
**File:** apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js:1

```js
export * from "@/features/feed/hooks/useFeed";
```

**Issue:** The feed hooks adapter re-exports the legacy state-based `useFeed.js` hook, not the canonical `useCentralFeed.js`. The canonical hook migrated to React Query in a prior sprint; the adapter boundary was never updated. Any external feature consuming `useFeed.adapter.js` receives the legacy implementation — stale React state, no cache, no React Query integration. The adapter boundary is serving the wrong contract.

**Contract:** Adapters must expose the current implementation of the feature's public surface. A frozen adapter is an integrity failure — it silently routes consumers to deprecated code.

**Fix:** Update `useFeed.adapter.js` to re-export from `useCentralFeed.js`. Handle API compatibility if the hook signature changed.

**Route:** IRONMAN (VEN-FEED-009, ARCHITECT FINDING-001)

---

**VIOLATION CRV-2026-06-06-003**
**Rule:** Controllers own business logic; layer responsibility rule
**Severity:** HIGH
**File:** apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js:33-37

```js
export async function listActorPosts({ actorId, viewerActorId, limit }) {
  if (!actorId) throw new Error("Missing actorId");
  if (!viewerActorId) throw new Error("Missing viewerActorId");
  return listActorPostsByActorDAL({ actorId, ...(limit != null && { limit }) });
  // viewerActorId validated for non-empty but NEVER passed to DAL
}
```

**Issue:** The controller accepts `viewerActorId`, validates it as non-empty, and then silently discards it. The DAL receives only `actorId`. No visibility model, no viewer scoping, no block/follow/privacy filter is applied on the profile posts path. The validation creates a false appearance of viewer-aware behavior while delivering viewer-blind results.

**Contract:** "Controllers own business logic." A controller that validates an input and then discards it has broken its business logic contract. The validation is meaningless if the value never flows to the logic that would use it. The controller comment "RLS enforces visibility & privacy" is an assertion, not a verified invariant — and it delegates the entire business logic contract to the DB layer.

**Fix:** Either (a) pass `viewerActorId` to the DAL and apply an app-layer visibility filter (equivalent to the central feed's `resolveFeedRowVisibilityModel`); or (b) formally document and verify via CARNAGE that RLS on `vc.posts` fully enforces block/follow/privacy for authenticated callers, then make the controller comment a verified contract claim.

**Route:** IRONMAN + CARNAGE (VEN-FEED-004, ELEK-2026-06-06-005)

---

**VIOLATION CRV-2026-06-06-004**
**Rule:** Cross-feature boundary — shared controllers must be exposed via adapter
**Severity:** HIGH
**File:** apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js

**Issue:** The controller is documented as `@SSOT: PROFILE + FEED POSTS` and `@UsedBy: useProfileView (profile domain)`. This means the profile domain imports from this controller directly at `@/features/feed/controllers/listActorPosts.controller.js`. The feed feature adapter (`useFeed.adapter.js`) does not expose this controller. External consumers bypass the adapter boundary entirely.

**Contract:** "Features may only import other features through adapters." The adapter is the only valid cross-feature import surface. Internal controller files (`.controller.js`) must never be imported directly from outside the feature.

**Fix:** Expose `listActorPosts` through the feed adapter (or create a dedicated data adapter). The profile domain must import through that adapter, not directly from the controller path.

**Route:** IRONMAN

---

## Medium Violations

---

**VIOLATION CRV-2026-06-06-005**
**Rule:** UI purity rule — screens must not contain business rules
**Severity:** MEDIUM
**File:** apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx:63

```js
const viewerIsAdult = identity?.kind === 'vport' ? true : (identity?.isAdult ?? null)
```

**Issue:** The screen directly computes the `viewerIsAdult` business rule — "vport actors are always considered adult." This is a domain rule (adult access policy) embedded in a view component. If the adult classification logic changes (e.g., vport subtypes get different rules), the change must be found and updated in a screen file rather than a controller or model.

**Contract:** "Screens must not contain business rules, domain validation, or permission enforcement." The adult flag derivation is a domain rule — it belongs in `getFeedViewerContext.controller.js` or a hook, not in the screen.

**Fix:** Move adult flag computation to `getFeedViewerContext.controller.js` or add a `useViewerAdultFlag()` helper hook that derives the correct value from identity context.

**Route:** IRONMAN

---

**VIOLATION CRV-2026-06-06-006**
**Rule:** Controllers own business logic — write path must enforce ownership
**Severity:** MEDIUM
**File:** apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js:12-14

```js
export async function ctrlMarkWelcomeCardSeen({ actorId }) {
  await markWelcomeFeedCardSeenDAL({ actorId })
}
```

**Issue:** The controller accepts an `actorId` parameter and writes directly to `vc.actor_onboarding_steps` without asserting that `actorId` belongs to the session making the call. Ownership assertion at the controller layer is the business logic contract for any write path. The sole backstop is Supabase RLS on the target table, which is unverified from source (CARNAGE required).

**Contract:** "Controllers own business logic." For a write path, business logic includes: who can perform this action on whose data. The controller currently delegates this entirely to the DB layer without a verified contract.

**Fix:** Add ownership assertion — compare `actorId` against the session-derived actor identity before calling the DAL. See ELEK-2026-06-06-001 suggested patch.

**Route:** IRONMAN + CARNAGE

---

**VIOLATION CRV-2026-06-06-007**
**Rule:** Controller fan-out rule — max 5 external collaborators
**Severity:** MEDIUM
**File:** apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js

**Issue:** `fetchFeedPagePipeline` calls 10 external collaborators in a single orchestration:

```
readFeedPostsPage (DAL)
readPostMediaMap (DAL)
fetchRawPostMentionEdgesDAL (DAL)
readHiddenPostsForViewer (DAL)
readActorsBundle (DAL)
readFeedBlockRowsDAL (DAL)
readFeedFollowRowsDAL (DAL)
readCommentCountsBatch (DAL)
readViewerReactionsBatch (DAL)
readReactionCountsBatch (DAL)
+ hydrateAndReturnSummaries (engine)
+ normalizeFeedRows (model)
```

The file is named `.pipeline.js` (not `.controller.js`), which correctly signals it is an orchestration layer. However, its functional role is controller-equivalent — it owns the business orchestration for one page of feed data. The pipeline pattern is legitimate, but the fan-out of 10+ collaborators is an architectural signal that this level of orchestration complexity warrants documentation and may become a maintenance liability.

**Contract:** "Controllers may call at most 5 external collaborators." The pipeline is exempt from this rule by naming convention, but it performs controller-equivalent work. The fan-out is architecturally significant.

**Fix:** Document the pipeline's fan-out explicitly in a BEHAVIOR.md contract section (once BEHAVIOR.md is written). No code change required unless a future refactor is planned.

**Route:** LOGAN (documentation), IRONMAN (if refactor is desired)

---

## Warnings

---

**WARNING CRV-2026-06-06-008**
**Rule:** File size — max 300 lines
**Severity:** LOW
**File:** apps/VCSM/src/features/feed/hooks/useCentralFeed.js — **292 lines**

8 lines from the 300-line hard limit. One small feature addition (additional derived state, a new useEffect, or inline helper) will breach the limit.

**Fix:** Preemptively extract image preload helpers (lines 22-61, ~40 lines) into a `useFeedImagePreload.js` utility hook before any new functionality is added.

---

**WARNING CRV-2026-06-06-009**
**Rule:** File size — max 300 lines
**Severity:** LOW
**File:** apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js — **280 lines**

20 lines from the 300-line limit. Several action handlers could be extracted into focused sub-hooks (block, share, report, follow) if the file grows.

---

**WARNING CRV-2026-06-06-010**
**Rule:** Architecture completeness — behavioral contract required
**Severity:** LOW
**File:** ZZnotforproduction/APPS/VCSM/features/feed/BEHAVIOR.md

BEHAVIOR.md is a placeholder with no contract content. The feed is the most complex feature in the social layer (9-DAL parallel pipeline, 4 visibility models, dual-hook architecture, welcome card state). No happy paths, edge cases, or behavioral invariants are documented. This is a governance completeness gap — not a code contract violation.

**Fix:** LOGAN route — author BEHAVIOR.md with at minimum: central feed load path, visibility rules, welcome card conditions, hook migration state, dual-hook status.

---

## Compliant Areas — Confirmed

| Area | Status | Evidence |
|---|---|---|
| Import paths — @/ only | COMPLIANT | grep found zero ../../ patterns across all 45 feed files |
| No select('*') | COMPLIANT | grep confirmed: no banned select patterns in any feed DAL |
| DAL layer — no permission enforcement | COMPLIANT | All DALs query data only; no RLS or ownership checks in DAL layer |
| Model purity | COMPLIANT | normalizeFeedRows, feedRowVisibility, feedBlockVisibility, feedFollowVisibility — pure functions |
| File naming conventions | COMPLIANT | All files correctly follow naming contract |
| Folder depth | COMPLIANT | Max depth: feed/adapters/hooks/ = 2 levels below feature root |
| Dependency direction | COMPLIANT | @hydration (engine), @debuggers (engine) — app → engine only |
| Identity surface | COMPLIANT | profileId/vportId used as DB FK references only; actorId+kind are identity surface |
| Actor core rule | COMPLIANT | CentralFeedScreen derives from useIdentity(); queryKeys include actorId |
| Actor rule 4 (query keys) | COMPLIANT | queryKeys.centralFeed(viewerActorId, realmId) — actor-scoped |
| No TypeScript files | COMPLIANT | All .js / .jsx; no .ts / .tsx found |
| No CSS-in-JS / Tailwind hardcoded colors | COMPLIANT (partial) | No raw hex values in feed files reviewed; styles imported via CSS files |

---

## Summary Counts

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 4 |
| MEDIUM | 3 |
| LOW / WARNING | 3 |

---

## Overall Status

**PARTIALLY COMPLIANT**

The feed feature's DAL and model layers are architecturally clean and correctly implement the layering contract. The core issues are concentrated in three areas: (1) the adapter boundary, which is frozen and has an unprotected cross-feature SSOT controller; (2) controllers that accept inputs they never use, creating illusory business logic layers; and (3) a screen that computes a business rule. No critical boundary reversals or dependency inversions were found.

The four HIGH violations are all IRONMAN-routable code changes with clear fix paths.

---

## Required Follow-up Commands

| Command | Reason | Violations Addressed |
|---|---|---|
| IRONMAN | Update useFeed.adapter.js to re-export useCentralFeed | CRV-002 |
| IRONMAN | Expose listActorPosts via feed adapter; fix profile domain cross-feature import | CRV-004 |
| IRONMAN | Move profiles CSS import to shared/ or profiles adapter | CRV-001 |
| IRONMAN | Restore viewerActorId to listActorPosts business logic | CRV-003 |
| IRONMAN | Move adult flag derivation out of CentralFeedScreen | CRV-005 |
| IRONMAN | Add ownership assertion to feedWelcomeCard.controller | CRV-006 |
| CARNAGE | Verify RLS on vc.actor_onboarding_steps (CRV-006 DB backstop) | CRV-006 |
| CARNAGE | Verify RLS on vc.posts for profile posts path (CRV-003 DB backstop) | CRV-003 |
| LOGAN | Author BEHAVIOR.md for the feed feature | CRV-010 |

---

## Contract Review Recommendation

**CAUTION** — Four HIGH violations require resolution before THOR release eligibility can be assessed. The violations compound the security findings from ELEKTRA (ELEK-2026-06-06-001, 005 overlap directly with CRV-003/006). Patching the controller business logic gaps resolves both the architecture and security concerns simultaneously.
