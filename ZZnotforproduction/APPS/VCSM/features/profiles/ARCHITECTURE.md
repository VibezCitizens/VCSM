---
name: vcsm.profiles.architecture
description: ARCHITECT V2 module architecture report for VCSM:profiles
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** profiles
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/profiles
**Independence Status:** DEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The profiles module is the universal actor profile renderer for VCSM. It resolves any route param (UUID, slug, "self", or username) to a canonical actor identity, determines actor kind (user vs. vport), and dispatches to the correct kind-specific profile view. For vport actors it manages a deeply nested sub-system covering service catalogs, menus, gas prices, rates, locksmith details, content pages, portfolio, reviews, and subscriber counts. For user actors it renders a tabbed view of posts, photos, friends, and vibe tags.

## OWNERSHIP

Platform feature team — profiles domain. Primary responsibility: actor identity presentation, slug resolution, profile gating (privacy/block), and all vport kind-specific management screens. Cross-cuts: social engine (follow/privacy), block feature, identity engine, hydration engine, booking engine, review engine.

## ENTRY POINTS

- Route `/profile/:actorId` — handled by `ActorProfileScreen.jsx` (universal entry point)
- `ActorProfileScreen` dispatches to `PROFILE_KIND_REGISTRY` keyed by kind (`user` | `vport`)
- User kind: `ActorProfileViewScreen.jsx`
- Vport kind: `VportProfileKindScreen.jsx` → `VportProfileViewScreen.jsx`
- Public adapter exports: `useProfilesOps`, `useActorCanonicalSlug` via `profiles.adapter.js`

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 107 | readActorProfile.dal.js, resolveActorSlug.dal.js, friendRanks.reconcile.dal.js |
| Model | 100 | profile.model.js, getVportTabsByType.model.js, vportOwnership.model.js |
| Controller | 103 | getProfileView.controller.js, resolveActorBySlug.controller.js, upsertVportRate.controller.js |
| Service | N/A | No dedicated service layer — engine calls handled in controllers |
| Adapter | 23 (fm) | profiles.adapter.js, vportProfiles.adapter.js, ownership.adapter.js, exchange.adapter.js |
| Hook | 81 | useProfileView.js, useProfileGate.js, useActorCanonicalSlug.js, useVportType.js |
| Component | 6 | ActorProfileDevProbe.jsx, ActorProfileProdDebugPanel.jsx (most UI lives in screens) |
| Screen | 221 | ActorProfileScreen.jsx, VportProfileKindScreen.jsx, VportProfileViewScreen.jsx |
| Barrel | 30 | profiles.adapter.js and sub-index files throughout kinds/vport |

Counts from scanner callgraph data (cg_layerCounts).

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source confirms purpose; BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md has no actual contract |
| Owner defined | FAIL | No OWNERSHIP.md, no owner comment in source | No declared owner |
| Entry points mapped | PASS | ActorProfileScreen.jsx, PROFILE_KIND_REGISTRY | Well-structured route dispatch |
| Controllers present/delegated | PASS | 103 controllers (cg) | None |
| DAL/repository present/delegated | PASS | 107 DAL entries (cg) | None |
| Models/transformers present | PASS | 100 model entries (cg) | None |
| Hooks/view models present | PASS | 81 hooks (cg) | None |
| Screens/components present | PASS | 221 screens (cg), 6 components | None |
| Services/adapters present | PASS | 23 adapters (fm), cross-feature boundaries respected | None |
| Database objects mapped | PASS | Write surfaces cover profiles, content_pages, locksmith_*, menu_*, rates, services, friend_ranks, subscribers | No RPC ownership audit |
| Authorization path mapped | PASS | useProfileGate.js — privacy + block + follow chain | console.error in requestFollow — should be silent or notify |
| Cache/runtime behavior mapped | PASS | TTL caches in readActorProfile.dal.js (30s), resolveActorSlug.dal.js (10min), useProfileView staleTime 60s | Multiple independent caches may diverge |
| Error/loading/empty states mapped | PASS | Skeleton loading, not-found redirect to /feed, slug error message | Error message is generic — no retry option |
| Documentation linked | PARTIAL | BEHAVIOR.md present but PLACEHOLDER — no actual contract content | Full behavior contract not written |
| Tests/validation noted | PASS | 12 test files across DAL, controller, hook, and model layers | No screen-level or integration tests |
| Native parity noted | N/A | Not applicable | |
| Engine dependencies mapped | PASS | 12 engines declared and confirmed in source | booking, chat, content, hydration, identity, media, menu, notification, portfolio, profile, qr, review |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | engine | inbound | YES — via adapter | useIdentity, actor resolution |
| engines/hydration | engine | inbound | YES — via adapter | useActorStore hydration |
| engines/profile | engine | inbound | YES — via adapter | Profile engine reads |
| engines/booking | engine | inbound | YES — via adapter | Booking data on vport screens |
| engines/review | engine | inbound | YES — via adapter | Reviews tab on vport |
| engines/menu | engine | inbound | YES — via adapter | Menu tab on vport |
| engines/media | engine | inbound | YES — via adapter | Media uploads for portfolio |
| engines/notification | engine | inbound | YES — via adapter | Post publish notifications |
| engines/portfolio | engine | inbound | YES — via adapter | Portfolio tab on vport |
| engines/qr | engine | inbound | YES — via adapter | QR code modal on profile header |
| engines/chat | engine | inbound | YES — via adapter | Messaging from profile |
| engines/content | engine | inbound | YES — via adapter | Content pages on vport |
| features/social | feature | inbound | YES — via adapter | Privacy, follow, block adapters |
| features/block | feature | inbound | YES — via adapter | Block status in useProfileGate |
| vc.actors | db table | read | N/A | Actor kind and IDs |
| public.profiles | db table | read/write | N/A | User profile data (read; settings writes it) |
| vport.profiles | db table | read/write | N/A | Vport profile data |
| content_pages | db table | write | N/A | createVportContentPage, deleteVportContentPage |
| locksmith_* | db tables | write | N/A | Service areas, service details, portfolio details |
| menu_categories / menu_items | db table | write | N/A | Menu CRUD |
| rates | db table | write | N/A | upsertVportRateDal |
| services / service_addons | db table | write | N/A | Vport service catalog |
| vc.friend_ranks (RPCs) | db rpc | write | N/A | reconcileFriendRanks, saveFriendRanks |
| vc.count_vport_subscribers | db rpc | read | N/A | Subscriber count |
| vc.list_vport_subscribers | db rpc | read | N/A | Subscriber list |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.actors | READ | identity engine | profiles (readActorProfile.dal) | LOW |
| public.profiles | READ + WRITE (partial) | auth/settings | profiles (read), settings (write) | MEDIUM — profiles reads raw table |
| vport.profiles | READ + WRITE (partial) | vport feature | profiles (read), vport/settings (write) | MEDIUM — profiles reads raw table |
| content_pages | INSERT/UPDATE/DELETE | profiles | profiles only | LOW |
| locksmith_service_areas | INSERT/UPDATE/DELETE/UPSERT | profiles | profiles only | LOW |
| locksmith_service_details | UPSERT/DELETE | profiles | profiles only | LOW |
| locksmith_portfolio_details | UPSERT | profiles | profiles only | LOW |
| menu_categories / menu_items / menu_item_media | INSERT/UPDATE/DELETE | profiles | profiles only | LOW |
| rates | UPSERT | profiles | profiles only | LOW |
| services | UPSERT | profiles | profiles only | LOW |
| service_addons | DELETE | profiles | profiles only | LOW |
| vc.friend_ranks (get/save) | RPC READ+WRITE | profiles | profiles only | LOW |
| vc.count_vport_subscribers | RPC READ | profiles | profiles only | LOW |
| vc.list_vport_subscribers | RPC READ | profiles | profiles only | LOW |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | ActorProfileScreen handles "self", UUID, slug, username — all paths covered | LOW |
| Loading state | READY | Skeleton on all async branches including slug resolution, kind fetch, canonical redirect | LOW |
| Empty state | READY | slugNotFound → redirect /feed; missing canonical slug → redirect /feed | LOW |
| Error state | PARTIAL | Slug resolution error shows generic message; no retry UI | User has no recovery path on transient error |
| Auth/owner gates | READY | useProfileGate enforces privacy + block + follow; vport ownership checked via ownership.adapter | LOW |
| Cache behavior | WATCH | readActorProfileDAL 30s TTL, resolveActorSlug 10min TTL, useProfileView 60s staleTime — multiple caches | Cache invalidation requires coordinating multiple TTL layers |
| Runtime dependencies | READY | 12 engine imports all present in source; @hydration, @identity adapters confirmed | LOW |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/profiles/BEHAVIOR.md | PRESENT (PLACEHOLDER) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is PLACEHOLDER | HIGH | No contract for the largest feature module (374 files, 12 engines) — new engineers have no behavior reference | LOGAN |
| No retry/recovery UI on slug resolution error | MEDIUM | Transient DB errors permanently redirect user away — bad UX and no way to debug | IRONMAN |
| Multiple independent TTL caches may diverge | MEDIUM | 30s + 10min + 60s staleTime caches on overlapping data — stale state after update is likely | LOKI / KRAVEN |
| No screen-level or integration tests | MEDIUM | 12 tests cover only DAL/controller/model units — no route render or tab transition coverage | SPIDER-MAN |
| console.error in useProfileGate requestFollow | LOW | Error surfaces to browser console in production — should use silent fallback or notification | IRONMAN |
| No OWNERSHIP.md or declared owner | LOW | No named team responsibility for the largest feature in the platform | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

- `readActorProfileDAL` imports `getActorPrivacyAdapter` from `@/features/social/adapters/privacy/actorPrivacy.adapter` — this is a cross-feature import but goes through the social adapter boundary. APPROVED.
- `useProfileGate` imports `useBlockStatus` from `@/features/block` (not from `block/adapters/...`) — this is a direct cross-feature import. LOW risk (block is a small leaf feature), but violates adapter boundary convention.
- No other direct cross-feature DAL or controller imports detected in static scan.

---

## SPAGHETTI SCORE

**Module:** profiles
**Score:** WATCH
**Reasons:** 374 source files, 12 engine dependencies, 30 write surfaces across 14+ tables, 221 screen entries in callgraph. The module is architecturally well-layered (adapters, controllers, DALs, hooks all present) but its sheer size and 12 engine cross-cuts make it the highest-risk module in the platform for drift. The vport kinds sub-system (kinds/vport/) is a module-within-a-module that warrants its own architecture review.
**Release risk:** MEDIUM

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no actual behavior content

**Check A (Source without behavior):** FAIL — BEHAVIOR.md is present but contains only a placeholder with no section definitions, no happy paths, no engine declarations, no data change documentation.
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no §3 happy paths to cross-check against source.
**Check C (§13 engine consistency):** N/A — BEHAVIOR.md has no §13 section. Source declares 12 engines: booking, chat, content, hydration, identity, media, menu, notification, portfolio, profile, qr, review. All confirmed in source imports.
**Check D (§6 data change consistency):** N/A — BEHAVIOR.md has no §6 section. Scanner write surfaces confirm 30 distinct write operations across content_pages, locksmith_*, menu_*, rates, services, friend_ranks, content, and subscriber RPCs.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write full BEHAVIOR.md contract | Largest feature in platform has no behavior contract — blocks VENOM, LOKI, SENTRY audits | LOGAN |
| P2 | Error recovery UI for slug resolution failures | Transient errors silently redirect users to /feed — data loss for users visiting valid profiles | IRONMAN |
| P2 | Cache coherence review | Three independent caches (30s, 10min, 60s) on overlapping profile data — stale display after updates | LOKI / KRAVEN |
| P3 | Screen/integration test coverage | 221 screen entries, 0 screen tests — slug routing and tab transitions completely untested | SPIDER-MAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md is a PLACEHOLDER; full contract must be authored before any other audit
- **IRONMAN** — owns error recovery gap and useProfileGate console.error; declare module owner
- **LOKI** — cache coherence: three independent TTL layers need runtime tracing
- **KRAVEN** — 10-minute slug resolution cache + 12 engine calls per profile load — performance profiling warranted
- **SPIDER-MAN** — 0 screen/route tests on a 374-file module; regression safety net needed
- **VENOM** — write surfaces touch locksmith/menu/rates/services — auth gates on owner mutations need security audit

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
