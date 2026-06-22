# IRONMAN OWNERSHIP AUDIT — Profiles Feature

**Feature:** profiles
**Application Scope:** VCSM
**Date:** 2026-05-22
**Reviewer:** IRONMAN
**Trigger:** CEREBRO-directed verification of vcsm.profiles.architecture.md — ownership gaps, photo reactions, VPORT type map
**Status:** OWNERSHIP GAPS IDENTIFIED

---

## IRONMAN TARGET

Feature / Engine: profiles (apps/VCSM)
Application Scope: VCSM
Reason for ownership review:
- Source document marks ownership as PARTIAL ("No IRONMAN record")
- Photo reaction ownership ambiguous
- Post data reads in profiles — ownership conflict with `post` feature
- VPORT type configuration map undocumented
- Error state ownership unassigned

---

## EXISTING IRONMAN RECORDS CHECK

Searched `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/`:
- `vcsm.profiles.owner.md` — **NOT FOUND**
- No profiles ownership record exists in any form

**Status:** MISSING — no ownership record for the largest feature module in VCSM (416 files)

---

## CODE ROOTS

Primary path: `apps/VCSM/src/features/profiles/`
Related paths:
- `apps/VCSM/src/features/profiles/kinds/vport/` (VPORT-type-specific sub-modules)
- `apps/VCSM/src/features/profiles/adapters/` (cross-feature boundary surface)
- `apps/VCSM/src/features/profiles/screens/views/tabs/` (tab views for friends, photos, posts, tags)
Entry files:
- `screens/ActorProfileScreen.jsx` (public profile entry)
- `screens/UsernameProfileRedirect.jsx` (legacy redirect)
- `kinds/vport/screens/VportProfileKindScreen.jsx` (VPORT profile entry)

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|:---:|---|
| Feature ownership (profiles) | profiles | HIGH | Core responsibility |
| Engine ownership (@hydration consumer) | hydration engine | HIGH | Actor data via adapter |
| Engine ownership (@reviews consumer) | reviews engine | HIGH | Review panels via adapter |
| Engine ownership (@portfolio consumer) | portfolio engine | HIGH | Portfolio panel via adapter |
| DAL ownership (profiles) | profiles | HIGH | 72 DAL files in profiles |
| DAL ownership (post reads) | **CONFLICTED** | HIGH | profiles reads vc.posts directly — post feature should own |
| Controller ownership (profile resolution) | profiles | HIGH | 61 controller files |
| UI ownership (profile rendering) | profiles | HIGH | 132 component files |
| Runtime ownership (profile load) | profiles | HIGH | Entry point confirmed |
| Data ownership (vc.posts) | **CONFLICTED** | HIGH | profiles reads post data directly |
| Data ownership (vport.services) | profiles | HIGH | profiles writes services |
| Data ownership (vport.rates) | profiles | HIGH | profiles writes rates |
| Data ownership (vport.fuel_prices) | profiles | HIGH | profiles writes fuel prices |
| Rule ownership (photo reactions) | **CONFLICTED** | HIGH | Hook in profiles, reactions belong to post domain |
| Security ownership (owner writes) | **PARTIAL** | MEDIUM | Some gates exist; upsertVportServices missing controller gate |
| Documentation ownership | **MISSING** | HIGH | No Logan doc; system audit exists but not Logan canonical |
| Native parity ownership | N/A | HIGH | Source document declares N/A |

---

## OWNERSHIP CLARITY CLASSIFICATION

**Profiles module overall:** PARTIAL
**Evidence:** Core rendering, VPORT type panels, and lifecycle are clearly owned by profiles. Post data reads, photo reaction RPCs, and error state design have no clear or conflicted owners.
**Confidence:** HIGH

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `vc.posts` | **post feature** | profiles (CONFLICT — direct DAL reads) | post feature | DB/Carnage | Carnage | LOGAN (vcsm.dal.post.md) |
| `vc.post_media` | **post feature** | profiles (CONFLICT — direct reads in fetchPostsForActor) | post feature | DB/Carnage | Carnage | LOGAN |
| `vc.post_mentions` | **post feature** | profiles (via fetchPostsForActor) | post feature | DB/Carnage | Carnage | LOGAN |
| `vc.actors` | identity | profiles (reads for kind/profile/slug) | identity | DB/Carnage | Carnage | LOGAN (vcsm.dal.actors.md) |
| `vc.actor_follows` | social | profiles (reads for gate) | social | DB/Carnage | Carnage | LOGAN |
| `vc.actor_blocks` | block | profiles (reads for gate) | block | DB/Carnage | Carnage | LOGAN (vcsm.block.owner.md) |
| `vc.actor_owners` | identity | profiles (reads for ownership check) | identity | DB/Carnage | Carnage | LOGAN (vcsm.identity.owner.md) |
| `vport.profiles` | profiles | profiles (reads public details) | profiles (via settings) | DB/Carnage | Carnage | MISSING |
| `vport.services` | **profiles** | profiles | profiles | DB/Carnage | Carnage | MISSING |
| `vport.rates` | **profiles** | profiles | profiles | DB/Carnage | Carnage | MISSING |
| `vport.fuel_prices` | **profiles** | profiles | profiles | DB/Carnage | Carnage | MISSING |
| `vport.menus / menu items` | **profiles** | profiles | profiles | DB/Carnage | Carnage | MISSING |
| `vc.friend_ranks` | **profiles** | profiles | profiles | DB/Carnage | Carnage | MISSING |
| `vc.actor_vibe_tags` | **profiles** | profiles | profiles (reads only) | DB/Carnage | Carnage | MISSING |

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Actor profile visibility (public) | profiles | Route + @hydration | MISSING | LOW |
| Profile privacy gate | profiles | Client (useProfileGate) + DB (RLS — unverified) | MISSING | HIGH |
| Block gate on profile view | profiles + block feature | Client (useProfileGate) + DB (RLS — unverified) | vcsm.block.owner.md | MEDIUM |
| VPORT owner write authorization | **PARTIAL** | Controller (inconsistent — upsertVportRate has check; upsertVportServices does not) | MISSING | HIGH |
| Photo reaction write (toggle/rose) | **CONFLICTED** | RPC (backend) | MISSING | MEDIUM |
| Post grid visibility (canViewContent) | profiles | Client gate only (insufficient) | MISSING | HIGH |
| Friend rank write | profiles | Controller (saveFriendRanks) | MISSING | LOW |
| Gas price suggestion approval | profiles | Controller (two-layer check) | MISSING | LOW |
| Menu content ownership | profiles | Controller (owner gate not confirmed) | MISSING | MEDIUM |
| VPORT content page ownership | profiles | Controller (readVportContentPage has ownership check in DAL — SENTRY violation) | MISSING | MEDIUM |

---

## OWNERSHIP BOUNDARY RISKS

---

### OWNERSHIP BOUNDARY WARNING — OW-001

**Location:** `profiles/dal/post/fetchPostsForActor.dal.js` + `profiles/dal/readActorPosts.dal.js`
**Current ambiguity:** The profiles feature owns two DAL methods that read `vc.posts`, `vc.post_media`, and `vc.post_mentions`. These tables belong to the `post` feature's domain. There is no `post.adapter` boundary between profiles and post data reads.
**Why it is risky:** Post schema changes (column additions, query shape changes, RLS updates) require updates in profiles DAL files rather than being centralized in the post feature. The profiles module creates a hidden dependency on the post schema.
**Severity:** HIGH
**Suggested ownership clarification:** Move post data reads to `features/post/` as canonical DAL methods. Create adapter methods in `post.adapter.js`. Profiles consumes via adapter. SENTRY SF-004 covers the enforcement path.
**Contracts touched:** Architecture Contract, Cross-Feature Boundary Contract

---

### OWNERSHIP BOUNDARY WARNING — OW-002

**Location:** `profiles/adapters/photos/photoReactions.adapter.js` + `profiles/screens/views/tabs/photos/hooks/usePhotoReactions.js`
**Current ambiguity:** "Photo reactions" in VCSM are reactions to posts displayed in the photos tab grid. The `usePhotoReactions.js` hook lives in profiles, but the RPCs it calls (`togglePostReaction`, `sendPostRose`) manipulate post reaction data owned by the post/reactions domain. There is no documentation of whether profiles owns this hook or whether it belongs to the post feature.
**Why it is risky:** If the post feature modifies the reaction RPC interface, profiles' `usePhotoReactions.js` breaks without any contract boundary. The photos tab is essentially a filtered post grid — reactions should be handled by the post feature with profiles consuming via adapter.
**Severity:** HIGH — unclear ownership with no contract
**Suggested ownership clarification:**
  - Option A: Move `usePhotoReactions.js` to `post` feature; expose via `post.adapter`; profiles photos tab consumes the adapter
  - Option B: Keep hook in profiles but add a contract documenting that profiles photos tab = post grid context; explicitly document the RPC dependency
**Contracts touched:** Actor Ownership Contract, Architecture Contract

---

### OWNERSHIP BOUNDARY WARNING — OW-003

**Location:** `profiles/controller/checkActorOwnership.controller.js`
**Current ambiguity:** Ownership verification is a cross-cutting business rule used in multiple features. The profiles module has its own ownership check controller (`checkActorOwnership.controller.js`) that delegates entirely to a DAL. This pattern is not shared — other features (e.g., booking, social) may have their own ownership checks.
**Why it is risky:** If ownership check logic needs to change (e.g., add secondary ownership support), it must be updated in each feature independently. There is no canonical ownership assertion utility.
**Severity:** MEDIUM
**Suggested ownership clarification:** The `assertActorOwnsVportActorController` pattern (already used in `upsertVportRate.controller.js`) should be the canonical form. The `checkActorOwnership.controller.js` should be refactored to use the same pattern. Long-term: ownership check should live in the identity engine or a shared utility.
**Contracts touched:** Actor Ownership Contract

---

### OWNERSHIP BOUNDARY WARNING — OW-004

**Location:** Multiple VPORT write controllers (rates, services, gas, menu, locksmith, barbershop)
**Current ambiguity:** Owner-gated write enforcement is inconsistent across VPORT controller types:
- `upsertVportRate.controller.js` — calls `assertActorOwnsVportActorController()` ✓
- `submitFuelPriceSuggestion.controller.js` — explicit identity comparison ✓
- `upsertVportServices.controller.js` — comment "RLS enforced" — no controller check ✗
- `readVportContentPage.dal.js` — ownership check in DAL (confirmed in vcsm.dal.profiles.md) ✗
- `locksmithServiceDetails.*` — ownership checks in DAL (confirmed in vcsm.dal.profiles.md) ✗
**Why it is risky:** No single enforced pattern for VPORT owner write authorization. New VPORT types added by developers may follow the unsafe pattern.
**Severity:** HIGH
**Suggested ownership clarification:** Document a mandatory ownership assertion pattern for all VPORT write controllers. Apply `assertActorOwnsVportActorController()` consistently. Track in profiles ownership record as a required rule.
**Contracts touched:** Actor Ownership Contract, VPORT Lifecycle Contract

---

## VPORT TYPE MAP

Based on filesystem analysis of `kinds/vport/` subdirectories:

| VPORT Type | Subdirectory | Has DAL | Has Controller | Has Hook | Has Screen | Notes |
|---|---|:---:|:---:|:---:|:---:|---|
| Gas Station | `gas/` | YES | YES | YES | YES | Full implementation |
| Exchange/FX | `exchange/` | YES | YES | YES | NO (tabs only) | Rate display/edit |
| Locksmith | `locksmith/` | YES | YES | YES | NO (components) | Service areas, portfolio |
| Barbershop | `barbershop/` | YES (post only) | YES | YES | YES | Booking + team |
| Menu/Restaurant | `menu/` | YES | YES | YES | YES | Full menu management |
| Portfolio | `portfolio/` | NO (engine) | YES | YES | YES | Via @portfolio engine |
| Services/Rates | `services/`, `rates/` | YES | YES | YES | YES | Generic service catalog |
| Review | `review/` | YES | YES | YES | YES | Via @reviews engine |
| Content Pages | `content/` | YES | YES | YES | YES | CMS-style pages |
| Subscribers | `subscribers/` | NO (root level) | YES | YES | YES | Subscriber management |
| Booking | `booking/` | NO (engine) | NO | YES | YES | Via booking engine |

**Config location:** `kinds/vport/config/vportTypes.config.js` (consumed via adapter)
**Documentation status:** MISSING — no Logan doc mapping VPORT types to panels, capabilities, and ownership rules

---

## RUNTIME OWNERSHIP MAP

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Public profile load | `ActorProfileScreen.jsx` | profiles | resolveActorBySlug, getActorKind, getProfileView | resolveActorSlug, readActorKind, readActorProfile | Serial waterfall (LOKI LF-001) |
| Profile gate | `useProfileGate.js` | profiles (client) + DB (server) | None | readFollowState, readActorPrivacy, readActorBlocks | Client-only gate (VENOM VF-004) |
| Post grid | `ActorProfilePostsView.jsx` | **CONFLICTED** (profiles owns read; post owns data) | getActorPosts | fetchPostsForActor | No cache (KRAVEN KF-004) |
| VPORT profile load | `VportProfileKindScreen.jsx` | profiles | getVportType, getVportPublicDetails | readVportType, vportPublicDetails.read | Type-dispatch pattern |
| Photo reactions | `ActorProfilePhotosView.jsx` | **CONFLICTED** (profiles UI; post domain RPCs) | photoReactions.controller | listPostReactions, listPostRoseCount | Optimistic UI |
| Owner writes (rates) | VPORT dashboard | profiles | upsertVportRate | upsertVportRate.dal, readVportRatesByActor | Owner-gated, TTL cache ✓ |
| Owner writes (services) | VPORT dashboard | profiles | upsertVportServices | upsertVportServicesByActor.dal | Owner-gated RLS-only ⚠ |

---

## DOCUMENTATION OWNERSHIP GAPS

| Document | Status | Path | Owner | Priority |
|---|---|---|---|---|
| `vcsm.profiles.owner.md` (canonical ownership record) | **MISSING** | `_CANONICAL/logan/marvel/ironman/` | IRONMAN → LOGAN | HIGH |
| Logan doc for profiles architecture | **MISSING** | `_CANONICAL/logan/vcsm/` | LOGAN | HIGH |
| VPORT type capability map | **MISSING** | `_CANONICAL/logan/vcsm/` | LOGAN | MEDIUM |
| Photo reaction ownership contract | **MISSING** | `_CANONICAL/logan/vcsm/` | IRONMAN + LOGAN | HIGH |
| vport.profiles, vport.services schema docs | **MISSING** | `_CANONICAL/logan/vcsm/dal/` | LOGAN | MEDIUM |
| Existing system audit | **PRESENT** | `_CANONICAL/logan/vcsm/vcsm.profiles.system-audit.md` | Reference only | INFORMATIONAL |
| Existing DAL index | **PRESENT** | `_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md` | Reference | INFORMATIONAL |

---

## IRONMAN FINAL STATUS

**Ownership Clarity:** PARTIAL
**Ownership Boundary Risk:** HIGH (conflicted post data ownership, photo reaction ownership, inconsistent owner write enforcement)
**Missing ownership record:** YES — `vcsm.profiles.owner.md` does not exist despite being the largest feature module (416 files)

**Release-blocking ownership gaps:**
- No controller-level ownership check on `upsertVportServices` (OW-004) — VENOM VF-002 / SENTRY SF-002
- Post data reads in profiles without adapter boundary (OW-001) — SENTRY SF-004

**Required actions:**
1. Create `vcsm.profiles.owner.md` in `_CANONICAL/logan/marvel/ironman/` — assign to LOGAN
2. Document photo reaction ownership decision (OW-002) — options: move to post feature OR document contract
3. Standardize VPORT owner write assertion pattern across all VPORT controller types (OW-004)
4. Create VPORT type capability map in Logan docs

**Recommended next command:** LOGAN (naming violations, doc creation, ownership record)
