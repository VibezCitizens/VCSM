---
name: vcsm.state.architecture
description: ARCHITECT V2 module architecture report for VCSM:state
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** state
**Application Scope:** VCSM
**Module Type:** state
**Primary Root:** apps/VCSM/src/state
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The `state` module is the global runtime state layer for the VCSM application. It owns identity resolution (session → engine → actor → hydration), actor switching, realm resolution, and cross-feature signal stores (profile gate, follow requests). It bridges the shared `identity` and `hydration` engines to the VCSM domain, exposing a public `useIdentity()` hook surface consumed app-wide.

## OWNERSHIP

Platform infrastructure team. This module is a foundational runtime concern — not a product feature. It is consumed by every feature in the app via `IdentityProvider` (mounted at the app root) and via Zustand stores imported directly.

## ENTRY POINTS

- `IdentityProvider` — mounted at app root via `apps/VCSM/src/app`; wraps all authenticated content
- `useIdentity()` — primary public hook, consumed by every authenticated feature
- `useIdentityDetailsDeprecated()` — legacy surface still in use
- `useIdentityDisplayDeprecated()` — legacy display convenience hook
- `useActorStore` (re-exported from `@hydration`) — cross-feature actor cache
- `useFollowRequestsStore` — signal store consumed by social feature
- `useProfileGateStore` — signal store consumed by profiles and social features
- `useIdentitySelectionStore` — Zustand store for active actor tracking

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 10 | identity.read.dal.js (actors, realms, profiles, actor_privacy_settings, vport.profiles) |
| Model | 5 | identity.model.js (toPublicIdentity, mapProfileActor, mapVportActor, isBlockedVportIdentity) |
| Controller | 1 | identity.controller.js (loadDefaultIdentityForUser, loadOwnedActorChoices, resolveRealmId) |
| Service | N/A | — |
| Adapter | N/A | — |
| Hook | 3 | useIdentityResolutionEffect.hook.js, useIdentitySync.js, useActorSummary.js |
| Component | N/A | — (IdentityDebugger.jsx and identitySwitcher.jsx are dev-only UI) |
| Screen | N/A | — |
| Barrel | 4 | state/index.js + sub-folder index/re-export files |

_Counts from cg_layerCounts scanner data._

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source readable; BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md contains no behavioral contract |
| Owner defined | FAIL | No ownership record anywhere | No OWNERSHIP.md or owner field in docs |
| Entry points mapped | PASS | IdentityProvider + useIdentity() clearly defined in source | — |
| Controllers present/delegated | PASS | 1 controller (identity.controller.js) | switchActor.controller.js in sub-folder — good isolation |
| DAL/repository present/delegated | PASS | 10 DAL nodes (cg) across identity.read.dal.js | Only read DAL — no write surfaces (correct for state layer) |
| Models/transformers present | PASS | 5 model nodes (cg); toPublicIdentity, mapProfileActor, mapVportActor present | — |
| Hooks/view models present | PASS | 3 hook nodes (cg): useIdentityResolutionEffect, useIdentitySync, useActorSummary | — |
| Screens/components present | N/A | State module — no screens expected | IdentityDebugger.jsx is dev-only UI, not a product screen |
| Services/adapters present | N/A | State module delegates to engines, no adapters needed | — |
| Database objects mapped | PASS | Reads: vc.actors, vc.realms, vc.actor_privacy_settings, vc.actor_owners, vport.profiles, vport.profile_categories, public.profiles | All read-only — no write surfaces |
| Authorization path mapped | PASS | RLS diagnostic built in (readActorPrivacyDiagnosticDAL); DELETED_ACCOUNT_SENTINEL pattern forces logout | — |
| Cache/runtime behavior mapped | PASS | In-flight dedup via _identityInflight Map; React Query (identityEngineQuery); Zustand stores for actor cache and signals | — |
| Error/loading/empty states mapped | PASS | loading/authLoading states in IdentityProvider; DELETED_ACCOUNT_SENTINEL for deleted actors; null returns for all DAL errors | — |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER — no actual contract written | No behavioral specification exists |
| Tests/validation noted | FAIL | 0 tests in scanner | No test coverage on identity resolution path |
| Native parity noted | N/A | Web-only module | — |
| Engine dependencies mapped | PASS | identity engine (resolveAuthenticatedContext, invalidateIdentityResultCache), hydration engine (hydrateActor, useActorStore) | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | engine | inbound | YES | resolveAuthenticatedContext, invalidateIdentityResultCache |
| engines/hydration | engine | inbound | YES | hydrateActor, useActorStore |
| apps/VCSM/src/services/supabase | internal service | inbound | YES | supabaseClient, vcClient, vportClient |
| apps/VCSM/src/app/providers/AuthProvider | app provider | inbound | YES | useAuth() |
| @tanstack/react-query | external | inbound | YES | useQueryClient for cache invalidation |
| zustand | external | inbound | YES | create() for Zustand stores |
| @debuggers/identity | dev-only | inbound | YES | debugLoginEvent, debugLoginError — gated behind IS_DEV |
| @debuggers/feed | dev-only | inbound | YES | debugFeedViewer — gated behind IS_DEV |
| @/bootstrap/bootstrap.invalidate | internal | inbound | YES | purgeChatMessageCache, purgeNotificationCache |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.actors | SELECT (id, kind, profile_id, vport_id, is_void, is_deleted) | identity DAL | identity.controller.js | RLS blocks row if actor_privacy_settings is missing — known risk, mitigated by diagnostic |
| vc.realms | SELECT (id, created_at) | identity DAL | identity.controller.js (resolveRealmId) | Low — read-only realm lookup |
| vc.actor_privacy_settings | SELECT (actor_id, is_private) | identity DAL | identity.controller.js (diagnostic) | Dev-only diagnostic; production path skips unless VITE_DEBUG_RLS_DIAGNOSTIC=1 |
| vc.actor_owners | SELECT (user_id) | identity DAL | readActorOwnerUserDAL | Ownership verification path |
| public.profiles | SELECT (full column list) | identity DAL | readProfileIdentityDAL | Legacy profile read — still active |
| vport.profiles | SELECT (id, owner_user_id, name, slug, ...) | identity DAL | readVportIdentityDAL | Vport identity resolution |
| vport.profile_categories | SELECT (category_key) | identity DAL | readVportIdentityDAL | vport_type resolution |

_No write surfaces — this is a read-only state/resolution module._

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | State module — no routes | — |
| Loading state | PASS | loading + authLoading tracked in IdentityProvider; consumers receive identityLoading | — |
| Empty state | PASS | Null identity propagated correctly; DELETED_ACCOUNT_SENTINEL triggers logout | — |
| Error state | PASS | DAL errors caught and logged; null returned on failure, never throws to caller | RLS PGRST116 handled with specific hint logging |
| Auth/owner gates | PASS | DELETED_ACCOUNT_SENTINEL for soft-deleted accounts; blockedVport auto-switch guard; isBlockedVportIdentity check | Blocked vport auto-switch depends on a user-kind actor being available — if none found, no switch occurs |
| Cache behavior | PASS | In-flight dedup Map prevents concurrent resolves for same userId:attempt; React Query for engine context; Zustand for actor cache | In-flight map is module-level (singleton) — restart clears it correctly |
| Runtime dependencies | PASS | identity engine + hydration engine both required at boot; auth provider must be parent in tree | Boot order enforced by provider tree |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/state/BEHAVIOR.md | PRESENT (PLACEHOLDER only) |
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
| BEHAVIOR.md is a placeholder | HIGH | This module resolves identity for every authenticated session — the behavioral contract should document happy path, failure modes, actor-switch flow, and realm resolution | LOGAN |
| Zero test coverage | HIGH | Identity resolution is the most critical boot-time path; no regression safety for DAL reads, model transforms, or inflight dedup logic | SPIDER-MAN |
| No ownership record | MEDIUM | Platform-level module with no declared owner — unclear who is responsible for changes | IRONMAN |
| useIdentityDetailsDeprecated + useIdentityDisplayDeprecated still exported | MEDIUM | Two deprecated hooks remain in the public surface with no documented sunset plan | IRONMAN |
| DELETED_ACCOUNT_SENTINEL logout path not formally documented | MEDIUM | Sentinel pattern is subtle — if callers don't handle it, a deleted user could be treated as missing identity, triggering self-heal loops | LOGAN |
| actorStore.js is a trivial re-export | LOW | File adds no value; could cause confusion about where the canonical store lives | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

- `identityContext.jsx` imports `purgeChatMessageCache` and `purgeNotificationCache` from `@/bootstrap/bootstrap.invalidate`. This is a cross-module concern. The state layer should not need to know about chat and notification cache internals — this is an acceptable pragmatic coupling but worth noting as a boundary smell.
- `IdentityDebugger.jsx` lives inside `state/identity/` but is a UI component. It is dev-only and gated appropriately; however, it violates the layer convention that UI lives in `components/` or `screens/`, not in the state layer.
- `actorStore.js` is a pure re-export of `useActorStore` from `@hydration`. This indirection layer adds no value and may confuse consumers about canonical import path.

---

## SPAGHETTI SCORE

**Module:** state
**Score:** CLEAN
**Reasons:** Well-separated concerns — DAL, model, controller, and context are distinct files. Engine dependencies are correctly injected. Inflight dedup is a clean pattern. Zustand stores are signal-only with no business logic leakage. Two deprecated hooks are a minor smell but tracked.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — contains no actual behavioral specification

**Check A (Source without behavior):** FAIL — Source is well-defined but BEHAVIOR.md is a placeholder
**Check B (Behavior without source):** PASS — No behavior claimed in BEHAVIOR.md that lacks source (nothing is claimed)
**Check C (§13 engine consistency):** PASS — Declared engines (hydration, identity) match actual engine imports (`@hydration`, `@identity`, `resolveAuthenticatedContext`, `hydrateActor`)
**Check D (§6 data change consistency):** PASS — No write surfaces declared or found in scanner; DAL is read-only

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md | Identity resolution is the most critical app path — no behavioral contract exists | LOGAN |
| P1 | Add test coverage for identity.controller.js and identity.model.js | Zero tests on boot-critical resolution path | SPIDER-MAN |
| P2 | Declare module ownership and sunset plan for deprecated hooks | Two deprecated hooks with no removal timeline | IRONMAN |
| P3 | Remove actorStore.js re-export indirection | File is noise; consumers should import from @hydration directly | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write the full BEHAVIOR.md behavioral contract for identity resolution, actor switching, realm resolution, and sentinel patterns
- **SPIDER-MAN** — Add regression tests for loadDefaultIdentityForUser, toPublicIdentity, mapProfileActor, mapVportActor, and the DELETED_ACCOUNT_SENTINEL flow
- **IRONMAN** — Own the deprecated hook sunset plan; own actorStore.js cleanup
- **SENTRY** — Monitor identity resolution failure rate and PGRST116 RLS blocks in production

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
