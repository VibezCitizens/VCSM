# DEAD AND SPAGHETTI CODE REPORT — Reviews Vport Dashboard

---

Application Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
Roots Scanned:
  - apps/VCSM/src/features/dashboard/vport/screens/ (dashboard entry)
  - apps/VCSM/src/features/profiles/kinds/vport/ (review logic layer)
  - engines/reviews/src/ (review engine)

Scan Context: Deep architect review of vport reviews dashboard module.
Related module report: modules/vcsm.vport-reviews-dashboard.architecture.md

---

## CODE HEALTH METRICS

| Module | Files | Layers | Cross-Feature Imports | Cycles | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| dashboard/vport (reviews entry) | 1 | 1 | 1 (adapter — clean) | 0 | 0 | CLEAN |
| profiles/vport/review (core logic) | 18 | 6 | 2 (notifications, identity) | 0 | 5 | WATCH |
| engines/reviews | 14 | 4 | 0 | 0 | 0 | WATCH |

---

## DEAD CODE FINDINGS

---

DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js
Code Type: DAL — Read
Classification: CONFIRMED DEAD
Evidence:
  - Zero imports found across entire apps/VCSM/src tree
  - Engine author enrichment path (engines/reviews/src/dal/authors.read.dal.js) is the active
    owner, called by listReviews engine controller via dalGetAuthorCardsForReviews
  - App DAL was pre-engine author enrichment — fully superseded by engine RPC path
Risk: MEDIUM — file imports from THREE Supabase clients (vcClient, supabaseClient, vportClient)
      and queries identity.actor_directory as a fallback. Misleading for contributors.
      If accidentally re-wired, creates a second non-engine author enrichment path.
Recommended action: DELETE CANDIDATE
  Imports clear: YES
  Route references clear: YES
  Dynamic import references clear: YES
  Runtime clear: LOKI verification pending
  Owner clear: IRONMAN confirmation pending
Recommended handoff: IRONMAN (ownership), LOKI (runtime verification before deletion)

---

DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js
Code Type: DAL — Write
Classification: CONFIRMED DEAD
Evidence:
  - Zero imports found across entire apps/VCSM/src tree
  - VportReviews.controller.js delegates to engineSubmitReview from @reviews engine
  - Engine write path: upsert_neutral_review RPC + dimension ratings write
  - App write DAL does direct table inserts that bypass the engine's RPC guards,
    uniqueness enforcement, and event emission
Risk: HIGH — if accidentally re-wired creates duplicate reviews bypassing engine guards.
      Most dangerous dead file in the module. Highest deletion priority.
Recommended action: DELETE CANDIDATE (P0 deletion priority)
  Imports clear: YES
  Route references clear: YES
  Dynamic import references clear: YES
  Runtime clear: LOKI verification pending
  Owner clear: IRONMAN confirmation pending
Recommended handoff: IRONMAN (confirm before deletion)

---

DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/model/review/VportReview.model.js
Code Type: Model
Classification: CONFIRMED DEAD
Evidence:
  - Zero imports found across entire apps/VCSM/src tree
  - Active mapping layer is vportReviews.mappers.js (in controller/review/ folder)
  - Engine models (Review.model.js, DimensionRating.model.js) own engine-level transforms
  - File header still shows Windows development machine path: C:\Users\trest\OneDrive\...
    (indicates pre-migration copy never cleaned up)
Risk: LOW — orphaned model causes confusion about which model is canonical for the review domain
Recommended action: DELETE CANDIDATE
  Imports clear: YES
  Route references clear: YES
  Runtime clear: LOKI pending
  Owner clear: IRONMAN pending
Recommended handoff: IRONMAN

---

DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/config/reviewDimensions.config.js
Code Type: Config
Classification: LIKELY DEAD
Evidence:
  - getReviewDimensionsForVportType not imported by any active controller, hook, or adapter
  - Engine resolves dimensions from reviews.review_dimensions table via getReviewFormConfig
  - Config contains hardcoded dimension sets by vport type group (13 groups + default)
  - Potential drift: if DB dimensions have been updated, this config is stale
Risk: MEDIUM — if re-wired, silently returns wrong dimension config per vport type.
      DB is the single source of truth for dimensions, not a JS config file.
Recommended action: VERIFY USAGE (grep broader, check test files) then DELETE CANDIDATE
  Imports clear: YES (grep across src)
  Runtime clear: LOKI pending
  Owner clear: IRONMAN + CARNAGE (DB dimension parity check)
Recommended handoff: IRONMAN, CARNAGE

---

DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/hooks/review/useVportReviewMine.js
         Function: submit() (lines 84–178, exported as mine.submit at line 276)
Code Type: Hook export — legacy function
Classification: LIKELY DEAD
Evidence:
  - VportReviewsView.jsx calls r.submitReview() exclusively (lines 106 and 212)
  - submit() uses a single tab-aware dimension (incompatible with compose form's
    normalizedRatings multi-dimension array format)
  - submitReview() was introduced as the replacement accepting { body, ratings[] }
Risk: LOW — exported but not called by canonical view. Confusing dual API surface on hook.
      Future contributors may use submit() thinking it's the canonical path.
Recommended action: VERIFY USAGE across all consumers including profile tab, then remove
Recommended handoff: IRONMAN

---

## SPAGHETTI CODE FINDINGS

---

SPAGHETTI CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx
Pattern: View Screen owns business state and async submit callback
Classification: LOW
Evidence:
  useState calls (6): body, ratingsMap, activeDimKey, submitting, submitErr, showDeleteConfirm
  handleSubmit (line 100): async function with validation, rating normalization, and submit call
  These belong in the hook layer not the view screen layer per architecture contract.
Architectural risk: View screen becomes a mini-controller. State growth in the compose form
  over time will make the screen increasingly untestable. The hook layer cannot be tested
  without mounting the full view.
Suggested untangling direction:
  1. Create: useVportReviewCompose.js alongside useVportReviewMine.js
  2. Move into it: body, ratingsMap, activeDimKey, submitting, submitErr, handleSubmit
  3. showDeleteConfirm can remain local (pure UI toggle, no business meaning)
  4. View screen passes callbacks from hook, composes components only
Recommended handoff: SENTRY

---

SPAGHETTI CODE FINDING
Location: VportReviewsView.jsx:5 vs useVportReviews.js:2
Pattern: Dual identity import paths within same module
Classification: LOW
Evidence:
  VportReviewsView.jsx: import { useIdentity } from "@/features/identity/adapters/identity.adapter"
  useVportReviews.js:   import { useIdentity } from "@/state/identity/identityContext"
  Both are resolving the same identity hook but via different module paths.
Architectural risk: If one import path is deprecated, the consuming file breaks silently.
  Contributors will follow whichever example they see first — creates long-term drift.
Suggested untangling direction: Standardize all identity access in this module to one canonical
  import path. Confirm canonical path with identity engine owner.
Recommended handoff: SENTRY

---

SPAGHETTI CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js:52
Pattern: Positional argument passed where named options object is expected
Classification: LOW
Evidence:
  Call: ctrlListReviews(targetActorId, limit)   where limit = 50 (number)
  Signature: async function ctrlListReviews(targetActorId, { limit = 25, cursor = null } = {})
  Destructuring a number (50) returns undefined for all keys — falls back to defaults
  Result: service review list uses limit=25 not limit=50 as intended
Architectural risk: LOW operationally. Service reviews show same 25 results regardless.
  But if the service has more than 25 reviews, load-more won't surface them correctly in
  service tab context.
Suggested untangling direction: Fix to ctrlListReviews(targetActorId, { limit: 50 })
Recommended handoff: SENTRY

---

## DUPLICATE IMPLEMENTATION FINDINGS

---

DUPLICATE IMPLEMENTATION FINDING
Behavior: Author card enrichment for review list
Locations:
  1. engines/reviews/src/dal/authors.read.dal.js — dalGetAuthorCardsForReviews
     ACTIVE — called by listReviews engine controller; 1 RPC per review (N+1)
  2. apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js
     — dalGetReviewAuthorCards — DEAD — also 1 RPC per review loop
  3. apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js
     — dalListActorCardsByActorIds — DEAD — multi-client join fallback
Active paths: #1 only
Risk: HIGH — #2 and #3 are dead but co-exist with active path. If re-enabled,
      conflicting enrichment logic runs concurrently.
Canonical owner: engines/reviews
Recommended consolidation path: Delete #2 and #3. Fix #1 to use batch RPC
  (requires CARNAGE DB migration for batch get_review_author_cards function).

---

DUPLICATE IMPLEMENTATION FINDING
Behavior: Review write path (upsert review)
Locations:
  1. engines/reviews/src/dal/reviews.rpc.dal.js — dalRpcUpsertNeutralReview — ACTIVE
  2. apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js
     — dalInsertVportReviewRow + dalUpdateVportReviewBody — DEAD
Active paths: #1 only (RPC-based, engine-guarded, event-emitting)
Risk: HIGH — dead write DAL has direct table insert logic bypassing engine upsert RPC
Canonical owner: engines/reviews
Recommended consolidation path: Delete #2 entirely.

---

DUPLICATE IMPLEMENTATION FINDING
Behavior: Review shape mapping (DB row → domain object)
Locations:
  1. engines/reviews/src/model/Review.model.js — ReviewModel() — ACTIVE (DB row → domain)
  2. apps/VCSM/src/features/profiles/kinds/vport/controller/review/vportReviews.mappers.js
     — mapReview() — ACTIVE (engine domain → hook shape)
  3. apps/VCSM/src/features/profiles/kinds/vport/model/review/VportReview.model.js
     — modelVportReviewRow() — DEAD (pre-engine DB row → legacy hook shape)
Active paths: #1 and #2 are complementary and correct (different layers, different roles)
Risk: LOW — #3 is orphaned and not conflicting. Cleanup only.
Canonical owner: engines/reviews (#1) + profiles/vport/controller/review (#2)
Recommended consolidation path: Delete #3.

---

## DELETION CANDIDATE SAFETY CHECK

| Candidate | Imports Clear | Routes Clear | Dynamic Refs Clear | Runtime Clear | Owner Clear | Status |
|---|---|---|---|---|---|---|
| vportReviewAuthors.read.dal.js | YES | YES | YES | PENDING LOKI | PENDING IRONMAN | LOKI VERIFY |
| vportReviews.write.dal.js | YES | YES | YES | PENDING LOKI | PENDING IRONMAN | LOKI VERIFY |
| VportReview.model.js | YES | YES | YES | PENDING LOKI | PENDING IRONMAN | LOKI VERIFY |
| reviewDimensions.config.js | YES | YES | YES | PENDING LOKI | PENDING IRONMAN+CARNAGE | VERIFY FIRST |
| submit() fn in useVportReviewMine | YES (no consumer) | N/A | N/A | PENDING LOKI | PENDING IRONMAN | VERIFY FIRST |

---

## FINAL CODE HEALTH STATUS

WATCH

The reviews module's active data path is engine-backed, RPC-driven, and architecturally sound.
The WATCH status is driven by:
  1. Dead code residue from pre-engine migration (confirmed dead: 3 files, likely dead: 1 config, 1 function)
  2. N+1 author card RPC loop in the engine itself (25 serial calls per list load)
  3. View screen boundary violation (compose form state in view layer)

None of these are release blockers at current traffic levels, but all should be resolved
before scaling exposure or onboarding additional contributors to this module.

---

## HANDOFF ROUTING

IRONMAN  → Dead code ownership confirmation + deletion sign-off (4 files + 1 function)
LOKI     → Runtime trace to confirm zero prod invocations on dead files before deletion
KRAVEN   → N+1 author card RPC (25 sequential RPCs per list page) + missing auth path cache
CARNAGE  → DB migration for batch get_review_author_cards RPC + dimension DB parity audit
SENTRY   → View screen boundary violation, service reviews arg bug, identity import alignment
VENOM    → upsert_neutral_review + get_review_author_card SECURITY DEFINER scope audit
LOGAN    → Write canonical Logan doc (zero documentation exists for this module today)
FALCON   → Native parity notes for review submit flow on dashboard
