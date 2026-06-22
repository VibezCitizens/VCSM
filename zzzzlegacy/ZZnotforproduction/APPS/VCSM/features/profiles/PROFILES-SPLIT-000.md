# PROFILES-SPLIT-000 — Boundary Enforcement Readiness Review

```
[PROFILES-SPLIT-000] Profiles Boundary Enforcement Readiness
Status: Complete (READ ONLY — no code changes, no moves, no ESLint implemented)
Priority: P1
Type: ARCHITECTURE
App: VCSM
Target: apps/VCSM/src/features/profiles/  (404 files)
Builds on: PROFILES-MEGAFOLDER-SPLIT-001
Date: 2026-06-08
```

> **Gate verdict: CONDITIONAL GO.** Boundary enforcement can begin, but the ESLint rule
> must land in **WARN mode**, not ERROR, until **two genuine shared-zone leaks are fixed**:
> `getProfileView.controller.js` (shared → citizen model) and `useProfilesOps.js`
> (shared → vport controllers). Everything else that "fails grep" today resolves by
> *relocation into its correct zone*, not by rewriting logic. Citizen ⇎ VPORT remains
> **provably zero** in both directions. **No barrel/index files exist** — grep visibility
> is total, so the boundary is fully observable.

---

## Method & Confidence

Direct ripgrep over all cross-zone edges + full reads of every dispatcher and boundary-bridge
file. Every claim below is backed by an exact `file:line`. Barrel check (`find -name index.js*`)
returned **empty** → no import path can bypass grep. This is a high-confidence audit.

---

## Deliverable A — Current Dependency Verification

| Edge | Count | Status |
|---|---|---|
| Citizen → Citizen | (internal) | OK |
| Citizen → Shared | yes (tabs render Actor*View) | OK / legitimate |
| **Citizen → VPORT** | **0** | ✅ **NONE** (`rg kinds/vport kinds/citizen/` = empty) |
| VPORT → VPORT | (internal, 13 subdomains) | OK |
| VPORT → Shared | yes (useProfileView/Gate, slug, Actor*View, header) | OK / legitimate |
| **VPORT → Citizen** | **0** | ✅ **NONE** (`rg kinds/citizen kinds/vport/` = empty) |
| **Shared → Citizen** | **9 import sites / 6 files** | ⚠️ 1 true leak + 1 dispatcher + 4 friends-misplacement |
| **Shared → VPORT** | **several** | ⚠️ 1 true leak + dispatcher + adapters(zone) + 1 test |

### Shared → Citizen edges (exact)

| Source | Target | Reason | Legitimate? |
|---|---|---|---|
| `controller/getProfileView.controller.js:2` | `kinds/citizen/model/profile.model` (`ProfileModel`) | User-branch profile mapping inside the polymorphic RPC | ❌ **TRUE LEAK** — shared must not reach into citizen. Resolve by promoting `ProfileModel` (or its user-mapping) into `shared/`. |
| `screens/views/ActorProfileViewScreen.jsx:22` | `kinds/citizen/tabs/CitizenTabRouter` | Dispatcher renders citizen tabs for `kind==="user"` | ✅ **Dispatcher seam — whitelist** |
| `screens/views/tabs/friends/hooks/useTopFriendActorIds.js:3-4` | `kinds/citizen/controller/friends/{getTopFriendActorIds,hydrateActorsIntoStore}` | Friends data | ⚠️ **Misplacement** — friends is citizen-only; file belongs in citizen zone |
| `screens/views/tabs/friends/hooks/useFriendLists.js:16-17` | `kinds/citizen/controller/friends/{getFriendLists,hydrateActorsIntoStore}` | Friends data | ⚠️ Misplacement → move to citizen |
| `screens/views/tabs/friends/hooks/useTopFriendCandidates.js:3-4` | `kinds/citizen/controller/friends/{getTopFriendCandidates,hydrateActorsIntoStore}` | Friends data | ⚠️ Misplacement → move to citizen |
| `screens/views/tabs/friends/hooks/useSaveTopFriendRanks.js:3` | `kinds/citizen/controller/friends/saveTopFriendRanks` | Friends data | ⚠️ Misplacement → move to citizen |

### Shared → VPORT edges (exact)

| Source | Target | Reason | Legitimate? |
|---|---|---|---|
| `hooks/useProfilesOps.js:3-5` | `kinds/vport/controller/getVportPublicDetails` + `kinds/vport/model/{getVportTabsByType, services/vportServiceCatalogFallback}` | Aggregator hook bundles vport ops; consumed externally by `settings/profile` + `vportDashboard` | ❌ **TRUE LEAK** — a shared hook is kind-aware. Resolve by splitting vport ops into a vport adapter, or reclassifying `useProfilesOps` as dispatcher-adjacent. |
| `screens/ActorProfileScreen.jsx:26,30` | `kinds/vport/hooks/{useVportType, useVportProfileBySlug}` | Kind prefetch before dispatch | ✅ **Dispatcher seam — whitelist** |
| `adapters/kinds/vport/**` (21 files) | `kinds/vport/**` | Adapters re-export vport internals | ✅ **Zone reclassification** — these ARE vport adapters; they fail only because they sit under generic `adapters/`. Move under vport zone (or treat `adapters/kinds/vport/` as vport-zone in the rule). |
| `dal/__tests__/vportPublicDetails.read.dal.test.js:41` | `kinds/vport/dal/vportPublicDetails.read.dal` | Test colocated wrong | ⚠️ LOW — relocate test with vport |

**Hidden barrel paths:** **NONE.** `find profiles -name "index.js*"` = empty. (INDEX.md's "30 barrels" refers
to `.adapter.js` re-export files, all of which are explicit and grep-visible.) No import bypasses visibility.

**Answers to explicit questions:**
- Citizen → VPORT imports? **No — zero.**
- VPORT → Citizen imports? **No — zero.**
- Hidden barrel paths bypassing grep? **No — there are no index barrels.**

---

## Deliverable B — Dispatcher Exception Audit

| File | Role | Disposition |
|---|---|---|
| `kinds/profileKindRegistry.js` | `{user, vport}` screen map — references BOTH domains | **True dispatcher seam → whitelist** |
| `screens/ActorProfileScreen.jsx` | Route entry; prefetches vport kind; `REGISTRY[kind]` | **True dispatcher seam → whitelist** |
| `screens/views/ActorProfileViewScreen.jsx` | The `user` screen; imports `CitizenTabRouter`; carries vestigial vport-normalization (lines 45-56) | **Dispatcher-adjacent → whitelist, but flag vestigial vport branch for cleanup** |
| `kinds/vport/screens/VportProfileKindScreen.jsx` | The `vport` screen; imports only vport | **Pure vport — NOT a dispatcher; needs no exemption** (lives in vport zone) |

### Whitelist (must be exempt from future boundary rules)

```
EXEMPT (may reference more than one domain):
  kinds/profileKindRegistry.js          → may import shared + vport (+ citizen via screen)
  screens/ActorProfileScreen.jsx        → may import shared + vport (kind prefetch)
  screens/views/ActorProfileViewScreen.jsx → may import shared + citizen (CitizenTabRouter)

NOT exempt (single-domain, no special privilege):
  kinds/vport/screens/VportProfileKindScreen.jsx   (pure vport)
  everything else
```

Minimal whitelist = **3 files.** The seam is small and well-contained — a strong readiness signal.

---

## Deliverable C — Shared Zone Validation

| Area | Truly actor-generic | Disguised citizen-only | Disguised vport-only |
|---|---|---|---|
| `controller/` | resolveActorBySlug, buildActorCanonicalSlug, getActorKind, getActorPosts, getActorVibeTags, profileCache, photoReactions | **getProfileView** (imports ProfileModel from citizen — leak) | — |
| `dal/` | all (polymorphic reads) | — | `__tests__/vportPublicDetails.read.dal.test.js` (test only) |
| `hooks/` | useProfileView, useProfileGate, useActorKind, useActorCanonicalSlug, useResolveActorBySlug, useActorSeoMeta, useActorSlugRedirect, useActorProfileActions | — | **useProfilesOps** (imports vport ctrl/models — leak) |
| `model/` | actorSeo, post, postCanonical, isDeletedProfileActor | — | — |
| `components/` | PrivateProfileGate, UnavailableProfileGate, header/{Message,Subscribe}button | — | — |
| `screens/` | ActorProfileHeader, ActorProfileTabs, Actor{Posts,Photos,Tags}View, profileheader/*, UsernameProfileRedirect | **screens/views/tabs/friends/\*\* (13 files)**, **ActorProfileFriendsView** | ActorProfileViewScreen vport-normalization lines 45-56 (vestigial) |

### Special-attention flags

| Item | Verdict | Move to |
|---|---|---|
| `screens/views/tabs/friends/**` (13 files) | Citizen-only disguised as shared | **citizen/** |
| `ActorProfileFriendsView.jsx` | Citizen-only (friends render only for citizen); only shared file calling `useIdentity()` directly | **citizen/** |
| `ActorProfileViewScreen.jsx` | Dispatcher; lines 45-56 vport-normalization is dead/vestigial (registry routes vport elsewhere) | **stay (whitelist), delete dead branch in Phase 6** |
| `styles/**` (7 CSS) | Mixed: `*-friends/photos-modern.css` → citizen; `barbershop-owner-mode`, `*-portfolio/team/booking-modern` → vport | **split per domain** |
| `controller/getProfileView.controller.js` | Shared with citizen-model dependency | **stay shared; promote ProfileModel into shared** |
| `hooks/useProfilesOps.js` | Shared with vport dependency; externally consumed | **stay shared; extract vport ops to vport adapter** |

---

## Deliverable D — Adapter Boundary Audit

`profiles/adapters/` = 27 files. Classification:

| Class | Files | Notes |
|---|---|---|
| **Shared Adapter** | `profiles.adapter.js`, `ui/PrivateProfileGate.adapter`, `ui/UnavailableProfileGate.adapter`, `photos/photoReactions.adapter`, `tags/tagsData.adapter` | Stay in shared/adapters boundary |
| **Shared Boundary Bridge** | `ui/actorProfileScreenDependencies.adapter.js` → block/social/post/moderation | Legit cross-feature aggregator (import direction: profiles → those features via their adapters). Safe. |
| **Citizen Adapter** | (none currently) | Citizen exposes nothing externally |
| **VPORT Adapter (passthrough)** | `vportProfiles`, `services`, `exchange`, `locksmith`, `config/vportTypes.config`, `screens/{review,rates,services}/*`, `hooks/{rates,services}/*`, `hooks/useVportPublicDetails`, `vportProfile` (umbrella) | Re-export `kinds/vport/*` internals. **Relocate into vport zone** — safe, mechanical. |
| **VPORT Boundary Bridge** | `ownership.adapter`, `hooks/gas/{useVportGasPrices,useOwnerPendingSuggestions,useSubmitFuelPriceSuggestion}`, `screens/gas/{VportGasPricesView, GasPricesPanel, GasStates, OwnerPendingSuggestionsList}` (8 files) | Re-export from **`@/features/vportDashboard/adapters/vportDashboard.adapter`** (OUTSIDE profiles). **Cannot relocate freely.** |

### Boundary Bridge detail (the 8 that reach into vportDashboard)

| Adapter | External dep | Direction | Risk | Relocation safe? |
|---|---|---|---|---|
| `ownership.adapter.js` | `vportDashboard.adapter` → `checkVportOwnershipController` | profiles ← vportDashboard | **HIGH** — VPORT write-ownership authority lives in another feature | No — needs ownership-relocation decision (logged) |
| `hooks/gas/*` (3) | `vportDashboard.adapter` | profiles ← vportDashboard | MEDIUM | Bridge must stay until gas logic relocates |
| `screens/gas/*` (4) | `vportDashboard.adapter` | profiles ← vportDashboard | MEDIUM | Bridge must stay |

> Special-attention adapters resolved: **ownership.adapter = Boundary Bridge (HIGH risk)**;
> **vportProfiles/services/locksmith/exchange = VPORT passthrough (safe to relocate)**.

---

## Deliverable E — ESLint Boundary Rule Feasibility

**Zone mapping required** (critical design note): the rule must treat `adapters/kinds/vport/`
as **vport-zone**, not generic adapter-zone — otherwise all 21 vport adapters false-positive.

```
Proposed zones (by path, post-relocation intent):
  shared   = profiles/{controller,dal,hooks,model,components,screens/views(generic),screens/components}
  citizen  = profiles/kinds/citizen + screens/views/tabs/friends + ActorProfileFriendsView
  vport    = profiles/kinds/vport + adapters/kinds/vport
  adapters = profiles/adapters/{profiles.adapter, ui/*, photos/*, tags/*}
  dispatch = WHITELIST {profileKindRegistry, ActorProfileScreen, ActorProfileViewScreen}

Rules:
  citizen  → citizen, shared, adapters        (NOT vport)
  vport    → vport, shared, adapters           (NOT citizen)
  shared   → shared, adapters                  (NOT citizen, NOT vport)
  dispatch → ANY (exempt)
```

### Files that FAIL immediately if rule = ERROR today

**TRUE BLOCKERS (logic dependency, not just placement) — 2:**

| # | File | Violation |
|---|---|---|
| 1 | `controller/getProfileView.controller.js` | shared → citizen (`ProfileModel`) |
| 2 | `hooks/useProfilesOps.js` | shared → vport (3 imports) |

**RESOLVE-BY-RELOCATION (pass once moved to correct zone) — ~18:**

| Group | Files | Fixed by |
|---|---|---|
| Friends hooks | `screens/views/tabs/friends/hooks/{useTopFriendActorIds, useFriendLists, useTopFriendCandidates, useSaveTopFriendRanks}.js` (+ 9 friends view/component files by association) | Move friends subtree → citizen zone |
| VPORT test | `dal/__tests__/vportPublicDetails.read.dal.test.js` | Move with vport |

**WHITELIST (exempt, not failures) — 3:** registry, ActorProfileScreen, ActorProfileViewScreen.

**Exact immediate fail count under naive ERROR rule (no whitelist, no relocation):**
- 2 true blockers
- 6 friends hook import-sites (4 files)
- 2 dispatcher files (would be whitelisted)
- 1 test
- = **~9 files flag**, of which **only 2 are genuine architectural blockers.**

**Feasibility verdict:** ✅ Feasible. Ship rule as **WARN** first; the whitelist neutralizes the
dispatcher; relocation neutralizes friends + test; only `getProfileView` + `useProfilesOps`
need real fixes before flipping to **ERROR**.

---

## Deliverable F — Extraction Readiness Score

| Area | Score | Justification |
|---|---|---|
| **Citizen Domain** | **READY** | 19 files 100% pure; zero vport coupling. Only action: relocate friends subtree (mechanical). |
| **VPORT Domain** | **MOSTLY READY** | 273 files isolated from citizen; 13 subdomains mostly self-contained. Blockers: 21 adapters misplaced (mechanical) + ownership/gas bridges to vportDashboard (HIGH) + gas/team not self-contained. |
| **Shared Layer** | **PARTIAL** | 2 genuine leaks (`getProfileView`→citizen model, `useProfilesOps`→vport). Otherwise clean polymorphic primitives. These 2 gate ERROR-mode enforcement. |
| **Dispatcher Layer** | **READY** | Clean 3-file seam; registry is sole kind branch; one vestigial dead branch to delete later. |
| **Adapter Layer** | **PARTIAL** | 5 shared + 13 vport-passthrough (relocate, safe) + 8 boundary bridges to vportDashboard (1 HIGH = ownership). |

---

## Deliverable G — Migration Order Validation

Proposed order is **directionally correct but mis-sequences enforcement**. If the boundary
rule (step 1) is enabled as ERROR before fixing the 2 shared leaks + relocating friends, the
build breaks immediately.

**REJECT as ERROR-first. Corrected order:**

| # | Step | Why changed |
|---|---|---|
| 1 | Boundary rule in **WARN** + 3-file whitelist + vport-zone path mapping | Original step 1 ok only in WARN mode |
| 2 | Relocate 21 VPORT passthrough adapters → vport zone (keep 8 bridges) | unchanged (was step 2) |
| 3 | **NEW: Resolve 2 shared leaks** — promote `ProfileModel` to shared; extract vport ops out of `useProfilesOps` | Inserted — required before ERROR mode |
| 4 | Relocate friends subtree (13 files) + `ActorProfileFriendsView` → citizen | Pulled earlier (part of Citizen Extraction) |
| 5 | Shared zone carve-out | was step 3 |
| 6 | Citizen extraction (remaining) | was step 4 |
| 7 | VPORT extraction + ownership-bridge decision (logged ticket) | was step 5 |
| 8 | Dispatcher cleanup → **flip rule to ERROR**; delete vestigial vport branch in ActorProfileViewScreen | was step 6 |
| 9 | Legacy removal | was step 7 |

Key change: **boundary rule lands WARN, not ERROR; a new "fix 2 shared leaks" step precedes
ERROR enforcement; friends relocation moves earlier.**

---

## Deliverable H — Risk Register

| ID | Severity | Category | Risk |
|---|---|---|---|
| OWN-01 | **CRITICAL** | Ownership Risk | `ownership.adapter.js` re-exports `checkVportOwnershipController` from **vportDashboard** (external). VPORT write-ownership authority lives outside profiles; bridge cannot relocate without an ownership-ownership decision. Blocks clean vport extraction. |
| SHARED-LEAK-01 | **HIGH** | Architecture Risk | `getProfileView.controller.js` (shared) imports citizen `ProfileModel`. Genuine shared→citizen leak; gates ERROR-mode rule. |
| SHARED-LEAK-02 | **HIGH** | State Risk | `useProfilesOps.js` (shared) imports vport controllers/models AND is consumed externally (`settings/profile`, `vportDashboard`). Kind-aware shared hook with cross-feature cache contract; gates ERROR-mode rule. |
| ADAPTER-01 | **HIGH** | Adapter Risk | 21 vport adapters misplaced under generic `adapters/`; ~15 external importers (vportDashboard/vport/flyerBuilder). Mechanical but largest path-rewrite surface. |
| BRIDGE-01 | **MEDIUM** | Adapter Risk | 7 gas adapters (3 hooks + 4 screens) bridge to vportDashboard; must persist until gas logic relocates. |
| DISPATCH-01 | **MEDIUM** | Route Risk | All profile routes funnel through one dispatcher; a regression breaks both domains. Mitigated by small 3-file whitelist. |
| CITIZEN-01 | **MEDIUM** | Architecture Risk | Friends subtree (13 files) citizen-by-dependency but in shared tree; relocate before ERROR mode. |
| CSS-01 | **LOW** | State Risk | `styles/**` mixes citizen+vport CSS; split per domain. |
| TEST-01 | **LOW** | Test Risk | `dal/__tests__/vportPublicDetails.read.dal.test.js` colocated in shared; move with vport. No coverage loss, just placement. |
| VESTIGIAL-01 | **LOW** | Architecture Risk | `ActorProfileViewScreen.jsx:45-56` dead vport-normalization; confirm dead, delete in cleanup. |
| ISOLATION-00 | **INFO** | — | Citizen⇎VPORT = zero edges both ways; no barrels; no shared cross-kind context; DAG dependency graph. Boundary is observable and already near-clean. |

---

## Gate Decision

```
Can boundary enforcement safely begin?   YES — in WARN mode, with the 3-file whitelist.
What blocks ERROR-mode enforcement?      Exactly 2 files: getProfileView.controller.js,
                                         useProfilesOps.js (the only true shared-zone leaks).
First extraction ticket (recommended):   PROFILES-SPLIT-001 — Relocate the 21 VPORT
                                         passthrough adapters into the vport zone
                                         (highest ROI, lowest risk, shrinks blast radius
                                         for every later phase). Land the WARN-mode ESLint
                                         rule + whitelist alongside it.
Gating follow-up before ERROR mode:      PROFILES-SPLIT-002 — Fix SHARED-LEAK-01/02 and
                                         relocate the friends subtree to citizen.
Highest single risk:                     OWN-01 — VPORT ownership authority living in
                                         vportDashboard, bridged through profiles.
```

### DB AUDIT NOTE (deferred — out of scope per constraints)

```
DB AUDIT NOTE:
- DB object: actor_owners RPC (behind checkVportOwnershipController, OWN-01)
- Risk: relocating the ownership bridge may change which feature owns the RPC call site.
- Why deferred: READ ONLY; constraints forbid RLS/authorization analysis. App-layer only.
- Suggested later SQL review: confirm RPC posture unaffected by app-layer relocation (call
  sites only; no schema change implied).
```

---

*Analysis only. No files moved, renamed, created, or modified. No ESLint rule implemented.
This document is the sole artifact.*
