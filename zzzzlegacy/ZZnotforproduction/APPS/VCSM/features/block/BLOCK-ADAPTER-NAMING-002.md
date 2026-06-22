# BLOCK-ADAPTER-NAMING-002 — Adapter Boundary Rule Public-Surface Fix

```
[BLOCK-ADAPTER-NAMING-002] adapter-boundary rule: recognize barrels + /adapters/ folders
Status: Complete (IMPLEMENTED — ESLint rule only; D.1 of OPTION C)
Priority: P2
Type: Lint / Enforcement classification
App: VCSM
Scope: eslint-plugin-vcsm-architecture/index.js (1 file)
Builds on: BLOCK-ADAPTER-NAMING-001 (decision OPTION C). D.2 rename deferred to NAMING-003.
Date: 2026-06-08
```

> **Result: SAFE TO KEEP.** The `adapter-boundary` rule now recognizes the codebase's real
> public surfaces (`.adapter` files, `/adapters/` folders, and feature `index.js` barrels).
> **9 misclassified errors cleared** across profiles/social/upload; **7 genuine deep-internal
> violations remain correctly flagged** (identity & authorization DAL/store/controller imports).
> No suspicious import became legal. No runtime change.

---

## Required Verification (pre-implementation)

1. **Current rule logic:** flags any cross-feature `@/features/<X>/…` import unless same-feature or the path contains the substring `.adapter`.
2. **Current approval heuristic:** `isAdapterImport = src.includes('.adapter')` — the *only* approved signal.
3. **Why `ctrlGetBlockedActorSet` failed:** consumed via `@/features/block` (the curated index barrel) — no `.adapter` substring → flagged, though the barrel is block's intended public surface.
4. **Why `ActorActionsMenu` failed:** imported from `@/features/block/adapters/ui/ActorActionsMenu` — inside the `/adapters/` folder but the filename lacks the `.adapter` suffix → flagged.
5. **Which other barrels become valid:** any `@/features/<X>` (or `…/index`) import. Baseline showed legitimate barrel consumers of `@/features/block` in **social** (follow + followRequests controllers + their tests) and **upload** (createPost) — all curated-index imports that should always have been allowed.

---

## Deliverable A — Exact Rule Change

`eslint-plugin-vcsm-architecture/index.js`, `adapter-boundary.create()`. Replaced the single
`.adapter`-substring check with a three-way approved-surface test:

```js
const afterFeature  = src.split('/features/')[1] ?? '';
const importedFeature = afterFeature.split('/')[0];
const isSameFeature = importedFeature === currentFeature;

// Approved public surfaces (already used as public entry points across the codebase):
//   A. *.adapter.* files
//   B. anything inside an /adapters/ folder
//   C. the feature's top-level index barrel (curated public API)
// Deep internals (controllers/, model/, dal/, stores, arbitrary files) remain rejected.
const withinFeature   = afterFeature.split('/').slice(1).join('/'); // path under the feature root
const isAdapterSuffix  = src.includes('.adapter');
const isAdaptersFolder = afterFeature.includes('/adapters/');
const isFeatureBarrel  =
  withinFeature === '' || withinFeature === 'index' || withinFeature.startsWith('index.');
const isApprovedSurface = isAdapterSuffix || isAdaptersFolder || isFeatureBarrel;

if (isSameFeature || isApprovedSurface) return;
```

Message updated to: *"…only through an approved public surface (adapter, /adapters/ folder, or index barrel)…"*

---

## Deliverable B — Violations Cleared (9)

| Feature | File | Import (now approved) | Surface kind |
|---|---|---|---|
| **Profiles** | `kinds/citizen/controller/friends/getFriendLists.controller.js:3` | `@/features/block` | barrel |
| **Profiles** | `kinds/citizen/controller/friends/getTopFriendActorIds.controller.js:2` | `@/features/block` | barrel |
| **Profiles** | `kinds/citizen/controller/friends/getTopFriendCandidates.controller.js:3` | `@/features/block` | barrel |
| **Profiles** | `screens/views/ActorProfileHeader.jsx:10` | `@/features/block/adapters/ui/ActorActionsMenu` | /adapters/ folder |
| **Social** | `friend/request/controllers/followRequests.controller.js:12` | `@/features/block` | barrel |
| **Social** | `friend/request/controllers/__tests__/followRequests.controller.test.js:63` | `@/features/block` | barrel |
| **Social** | `friend/subscribe/controllers/follow.controller.js:10` | `@/features/block` | barrel |
| **Social** | `friend/subscribe/controllers/__tests__/follow.controller.test.js:59` | `@/features/block` | barrel |
| **Upload** | `controllers/createPost.controller.js:18` | `@/features/block` | barrel |

All 9 verified individually → 0 `adapter-boundary` errors each.

---

## Deliverable C — Violations Still Present (7 — correctly rejected deep internals)

| Feature (importing file) | Rejected import | Why still flagged |
|---|---|---|
| booking `assertActorOwnsVportActor.controller.test.js:33,34` | `@/features/authorization/dal/actors.read.dal`, `…/actorOwners.read.dal` | DAL internal |
| vportDashboard `team/controller/vportTeamAccess.controller.js:12` | `@/features/identity/identitySelection.store` | store internal |
| chat `setup.js` | `@/features/identity/identity.read.dal` | DAL internal |
| hydration `vcsmActorHydrator.js` | `@/features/identity/identitySelection.store` | store internal |
| profiles `kinds/vport/screens/booking/hooks/useVportBookingView.js` | `@/features/identity/identity.controller` | controller internal |
| (consumer) | `@/features/identity/identitySelectors` | non-barrel root file (not `index`) |

All 7 are deep internals (DAL / store / controller / non-index root file) — enforcement remains strict.
*(Note: the profiles `useVportBookingView.js` identity-internal import is a pre-existing, separate
finding unrelated to Block; correctly still flagged. Out of scope here — not modified.)*

---

## Deliverable D — Impact Analysis

| Metric | Before | After | Delta |
|---|---|---|---|
| Total problems | 231 | 222 | −9 |
| **Errors** | **167** | **158** | **−9** |
| Warnings | 64 | 64 | 0 |
| **adapter-boundary errors** | **16** | **7** | **−9** |

- **How many errors disappear?** 9 (all adapter-boundary; only that rule changed, so the −9 total-error delta is entirely this rule — confirming a precise reclassification).
- **How many remain?** 7 — every one a deep internal (DAL/store/controller/non-index file).
- **Did any suspicious import become legal?** **No.** The 9 cleared all target curated public surfaces (block's `index.js` barrel + its `adapters/ui/` folder). No DAL/store/controller/model internal was newly permitted — verified by the 7 deep internals still failing.

> Baseline note: the streamed `rg -c "adapter-boundary"` reported 11; the authoritative count is
> **16** (deterministic after-count 7 + total-error delta 9). The grep undercounted because the
> booking test carries 2 violations on adjacent lines the filter merged.

---

## Deliverable E — Recommendation: **SAFE TO KEEP**

Evidence:
- Every cleared import targets a **curated public surface** (feature index barrel or `/adapters/` folder) — exactly the entry points the codebase already treats as public.
- Every **deep internal** (identity/authorization DAL, store, controller, non-index root file) **remains flagged** — internal-boundary enforcement is undiminished.
- Total error delta (−9) equals the count of legitimate reclassifications; warnings unchanged; zero runtime/behavior impact.
- The loosening is bounded: deep, non-adapter, non-barrel internals are still rejected.

Not "too broad": the rule still forbids reaching past a feature's public surface.

---

## Validation Counts (widest practical pass: `eslint src`)

```
BEFORE : 231 problems · 167 errors · 64 warnings · adapter-boundary = 16
AFTER  : 222 problems · 158 errors · 64 warnings · adapter-boundary = 7
DELTA  : -9 problems · -9 errors · 0 warnings · adapter-boundary -9
```

---

## Implementation Return

- **Files changed:** 1 — `eslint-plugin-vcsm-architecture/index.js` (`adapter-boundary` rule + message).
- **Import rewrites:** 0.
- **Behavior changed?** No (lint classification only).
- **Cleared:** 9 (profiles ×4, social ×4, upload ×1).
- **Remaining (correct):** 7 deep internals.
- **Suspicious imports made legal?** None.
- **Recommendation:** SAFE TO KEEP.
- **Follow-up:** `ActorActionsMenu.jsx → .adapter.jsx` rename remains **BLOCK-ADAPTER-NAMING-003** (optional hygiene; no longer needed for lint since the `/adapters/` folder is now recognized). Pre-existing identity deep-internal imports (5 sites) are a separate, unrelated finding.
- **PASS / FAIL:** **PASS.**

---

*Implementation: ESLint rule classification only. Profiles not modified. No renames, wrappers, or new surfaces created.*
