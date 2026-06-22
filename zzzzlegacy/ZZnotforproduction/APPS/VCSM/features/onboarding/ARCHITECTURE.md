---
name: vcsm.onboarding.architecture
description: ARCHITECT V2 module architecture report for VCSM:onboarding
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** onboarding
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/onboarding
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The onboarding module guides newly registered Citizens and Vport actors through a structured checklist of activation steps (completing their identity card, setting vibe tags, inviting a first citizen). It reads actor-scoped progress from the database, computes completion snapshots, and renders an interactive card-based UI that auto-hides once all steps are finished. The module supports both `user` (Citizen) and `vport` actor kinds with kind-aware completion logic.

## OWNERSHIP

Owned by the VCSM platform team — identity and activation domain. Sits in the onboarding activation path, after `auth` completes registration and before the actor is fully active in the social/marketplace layers. Cross-cuts `identity`, `profile`, and feed (feed reads `actor_onboarding_steps` via a separate DAL).

## ENTRY POINTS

- `OnboardingCardsView` — embedded in the home/feed screen, shown to any authenticated actor with incomplete onboarding steps. No dedicated route; surface is inlined.
- `CitizenVibesScreen` — navigated to via card CTA at `/citizen/vibes`, allows the actor to pick vibe tags.
- Adapter barrel: `apps/VCSM/src/features/onboarding/adapters/onboarding.adapter.js` — exports both screens for external consumption.

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 12 (cg) / 4 (fm) | onboardingSteps.dal.js, vibeTags.dal.js, profileCompletion.dal.js, vibeInvites.dal.js |
| Model | 15 (cg) / 1 (fm) | onboarding.model.js (all mappers + snapshot builders) |
| Controller | 8 (cg) / 3 (fm) | onboarding.controller.js, vibeTagsOnboarding.controller.js, onboarding.controller.helpers.js |
| Service | N/A | — |
| Adapter | N/A (cg) / 1 (fm) | onboarding.adapter.js |
| Hook | 2 (cg) / 2 (fm) | useOnboardingCards.js, useOnboardingVibeTags.js |
| Component | 4 (cg) / 3 (fm) | OnboardingCard.jsx, OnboardingCardList.jsx, VibeTagPicker.jsx |
| Screen | 5 (cg) / 2 (fm) | OnboardingCardsView.jsx, CitizenVibesScreen.jsx |
| Barrel | 2 (cg) | onboarding.adapter.js (barrel re-exports) |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source confirms 3-step onboarding card flow | BEHAVIOR.md is PLACEHOLDER — purpose not in docs |
| Owner defined | PARTIAL | No OWNERSHIP.md; ownership inferred from code | No formal ownership record |
| Entry points mapped | PASS | OnboardingCardsView + CitizenVibesScreen; adapter exports both | No dedicated route in route-map; embedded entry only |
| Controllers present/delegated | PASS | 3 controllers (main, vibeTagsOnboarding, helpers) | helpers.js partially serves as a service layer |
| DAL/repository present/delegated | PASS | 4 DAL files; explicit column selects throughout | No cross-feature DAL violations detected |
| Models/transformers present | PASS | All mappers + snapshot builders in onboarding.model.js | Model file is 207 lines — approaching split threshold |
| Hooks/view models present | PASS | 2 hooks: useOnboardingCards, useOnboardingVibeTags | — |
| Screens/components present | PASS | 2 screens, 3 components | — |
| Services/adapters present | PARTIAL | Adapter exports screens only; no service layer | helpers.js contains step-loading logic that is service-like |
| Database objects mapped | PASS | vc.actor_onboarding_steps (upsert), vc.vibe_actor_tags (update+upsert) | replaceSelectedVibeTagsDAL runs 2-op sequence without transaction |
| Authorization path mapped | PARTIAL | actorId guard at controller entry; no RLS verification in source | No ownership RLS check — actorId comes from identity hook |
| Cache/runtime behavior mapped | PARTIAL | No explicit cache; hook re-triggers on actorId change | No optimistic update; full refresh on every card load |
| Error/loading/empty states mapped | PASS | OnboardingCardsView handles loading skeleton, error+retry, empty (returns null), all-complete (returns null) | — |
| Documentation linked | FAIL | BEHAVIOR.md present but is PLACEHOLDER — no actual contract | BEHAVIOR.md must be written |
| Tests/validation noted | FAIL | 0 tests in scanner data | No test coverage for controller, model, or DAL |
| Native parity noted | N/A | No iOS native transfer in scope | — |
| Engine dependencies mapped | PASS | identity engine (via identity.adapter), profile engine | Engines accessed only through adapters — boundary respected |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | engine | onboarding → identity | YES — via identity.adapter | OnboardingCardsView imports useIdentity from identity adapter |
| engines/profile | engine | onboarding → profile | YES — consumed through DAL reads | profileCompletion.dal.js reads vc.profiles directly |
| features/identity | feature-adapter | onboarding → identity.adapter | YES | useIdentity hook |
| vc.actor_onboarding_steps | db-table | write | APPROVED | markActorOnboardingStepCompletedDAL (upsert) |
| vc.vibe_actor_tags | db-table | write | APPROVED | replaceSelectedVibeTagsDAL (update+upsert) |
| vc.onboarding_steps | db-table | read-only | APPROVED | readOnboardingStepsDAL |
| vc.vibe_tags | db-table | read-only | APPROVED | readVibeTagsDAL |
| vc.vibe_actor_tags | db-table | read | APPROVED | readSelectedVibeTagsDAL |
| vc.actors | db-table | read-only | APPROVED | readActorRowDAL via profileCompletion.dal |
| vc.profiles | db-table | read-only | APPROVED | readProfileCompletionFieldsDAL, readVportCompletionFieldsDAL |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.actor_onboarding_steps | upsert (write) | onboarding module | feed feature also reads (markWelcomeFeedCardSeenDAL) | Shared table — feed writes to same table outside this module |
| vc.vibe_actor_tags | update + upsert (write) | onboarding module | — | replaceSelectedVibeTagsDAL runs update then upsert without a transaction — partial-failure window exists |
| vc.onboarding_steps | read-only | platform/DB | onboarding | DB-driven step config; steps have fallbacks in STEP_DEFAULTS |
| vc.vibe_tags | read-only | platform/DB | onboarding, vibes screens | — |
| vc.profiles | read-only | auth/settings | onboarding completion read | Reads profile fields for completion scoring only |
| vc.actors | read-only | identity | onboarding | Reads actor.kind to branch citizen vs vport completion |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | WATCH | No dedicated route; embedded in feed/home screen via OnboardingCardsView | If feed screen doesn't include it, module is unreachable |
| Loading state | PASS | OnboardingCardsSkeleton renders 3 animated pulse cards | — |
| Empty state | PASS | `if (!cards.length) return null` — no empty state flash | Silently hides; no user feedback if zero cards loaded due to error |
| Error state | PASS | Error banner + Retry button rendered when hook reports error | — |
| Auth/owner gates | WATCH | actorId guard at controller entry; relies on identity hook — no server-side ownership check | If actorId is spoofed or stale, controller will load wrong actor's steps |
| Cache behavior | WATCH | No cache — full reload on every `refresh()` call | Potentially expensive for slow connections; 7 parallel DAL calls on load |
| Runtime dependencies | PASS | supabaseClient, react-router-dom (useNavigate), identity adapter — all present | SHOW_INVITE_ONBOARDING_CARD is hardcoded false — invite card never renders |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/onboarding/BEHAVIOR.md | PRESENT (PLACEHOLDER) |
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
| BEHAVIOR.md is PLACEHOLDER | HIGH | No documented contract for steps, completion rules, or CTA routing — any change can silently break expected behavior | LOGAN |
| 0 tests | HIGH | Controller builds complex parallel snapshots; model has many pure functions that are ideal for unit tests; no regression net | SPIDER-MAN |
| replaceSelectedVibeTagsDAL not transactional | MEDIUM | update (void all) + upsert (insert new) runs as two sequential DB calls — if upsert fails, actor loses all tags | VENOM / CARNAGE |
| SHOW_INVITE_ONBOARDING_CARD hardcoded false | MEDIUM | Invite card is permanently hidden; no flag management — this is a dead code path | IRONMAN |
| No route registered in route-map | LOW | OnboardingCardsView is not discoverable via route scanner; CitizenVibesScreen at /citizen/vibes not in route-map | HAWKEYE |
| CURRENT_STATUS.md was missing | LOW | Module had no status tracking before this run | ARCHITECT (resolved this run) |
| ARCHITECTURE.md was missing | LOW | No architecture documentation before this run | ARCHITECT (resolved this run) |

---

## MODULE BOUNDARY WARNINGS

- `OnboardingCardsView.jsx` imports directly from `@/features/identity/adapters/identity.adapter` — this is the adapter boundary and is correct per contract.
- `onboarding.controller.js` imports only from within the onboarding module's own DAL/model — no cross-feature internal imports detected.
- `feed` feature writes to `vc.actor_onboarding_steps` via `markWelcomeFeedCardSeenDAL` — this is a shared DB table, not a shared code import, so no boundary violation, but it represents a shared ownership risk on the table.
- No layer violations detected in static scan (no screen importing DAL directly, no DAL importing controller).

---

## SPAGHETTI SCORE

**Module:** onboarding
**Score:** WATCH
**Reasons:** The module is structurally clean with correct layer ordering and adapter boundary usage. Two concerns elevate it from CLEAN: (1) the invite card is permanently dead-coded with a hardcoded false flag, introducing silent dead paths; (2) `replaceSelectedVibeTagsDAL` performs a two-operation write without a transaction, creating a partial-failure risk. Controller logic is dense (7 parallel loads + kind-branching) but contained.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no actual behavior contract written

**Check A (Source without behavior):** FAIL — source exists and is substantive; BEHAVIOR.md has no contract content. A complete rewrite of BEHAVIOR.md is required.
**Check B (Behavior without source):** N/A — BEHAVIOR.md is a placeholder with no declared happy paths to verify against source.
**Check C (§13 engine consistency):** Scanner declares engines: [identity, profile]. Source confirms identity engine via `useIdentity()` from identity.adapter; profile engine accessed indirectly via `profileCompletion.dal.js` reads to `vc.profiles`. Consistent.
**Check D (§6 data change consistency):** Scanner write surfaces: `vc.actor_onboarding_steps` (upsert via markActorOnboardingStepCompletedDAL) and `vc.vibe_actor_tags` (update + upsert via replaceSelectedVibeTagsDAL). Source confirms both. Consistent.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md from scratch | Placeholder blocks any future governance, testing, or change review | LOGAN |
| P2 | Add unit tests for onboarding.model.js and onboarding.controller.js | Zero test coverage on a module with complex branching logic | SPIDER-MAN |
| P3 | Fix replaceSelectedVibeTagsDAL — wrap in a transaction or use a DB RPC | Two-op write without transaction is a data integrity risk | CARNAGE / VENOM |
| P4 | Resolve SHOW_INVITE_ONBOARDING_CARD dead code — either remove or wire to a feature flag | Hardcoded false creates invisible dead code | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md must be written; governance gap is the most critical issue
- **SPIDER-MAN** — Zero test coverage on a module with non-trivial snapshot logic
- **VENOM** — Non-transactional two-op write in replaceSelectedVibeTagsDAL; no server-side auth gate on step completion
- **CARNAGE** — Review replaceSelectedVibeTagsDAL for DB migration to an atomic RPC
- **IRONMAN** — Feature flag ownership for SHOW_INVITE_ONBOARDING_CARD and CTA route governance

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
