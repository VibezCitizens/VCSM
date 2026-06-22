---
name: vcsm.onboarding.behavior
description: Feature-level behavior contract for the VCSM onboarding feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P0
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — onboarding
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The onboarding feature guides newly registered Citizens and Vport actors through a structured checklist of activation steps. It reads actor-scoped progress from the database, computes completion snapshots, and renders an interactive card-based UI that auto-hides once all steps are finished.

The feature supports two actor kinds with kind-aware completion logic:
- `user` (Citizen) — completes a citizen identity card and sets vibe tags
- `vport` — completes a vport profile card and sets vibe tags

The invite step (`invite_first_citizen`) is defined in the step catalog but is permanently hidden via a hardcoded flag (`SHOW_INVITE_ONBOARDING_CARD = false`). The invite card never renders.

The feature sits in the activation path: after `auth` completes registration, before the actor is fully active in the social and marketplace layers.

Sources: ARCHITECTURE.md (§PURPOSE, §MODULE RUNTIME READINESS), INDEX.md (§Routes), modules/flow/INDEX.md

---

## §2 Entry Points

| Entry Point | Type | Route | Access | Source |
|---|---|---|---|---|
| `OnboardingCardsView` | view-screen (embedded) | No dedicated route — embedded in home/feed screen | Authenticated actor | ARCHITECTURE.md §ENTRY POINTS, SCREENS.md |
| `CitizenVibesScreen` | view-screen (route-linked) | `/citizen/vibes` | public (scanner classification) | SCREENS.md, INDEX.md §Routes |
| `onboarding.adapter.js` | adapter barrel | N/A | Feature export point | ARCHITECTURE.md §LAYER MAP, INDEX.md |

Additional CTA routes navigated to from onboarding cards (external, not owned by this feature):
- `/settings?tab=profile` — target for `complete_citizen_card` step CTA (owned by settings feature)
- `/invite` — target for `invite_first_citizen` step CTA (owned by invite feature; currently unreachable because card is hidden)

Source: modules/flow/ARCHITECTURE.md §Vibe Tag Selection Path, BW adversarial report §H.1

---

## §3 User Flows

### Happy Path 1 — Onboarding Cards Display
1. Authenticated actor loads the home/feed screen.
2. `OnboardingCardsView` is included in the feed screen layout.
3. `useOnboardingCards` hook calls `getOnboardingCardsController({ actorId })`.
4. Controller runs 7 parallel DAL reads: onboarding steps config, per-actor step completion, actor row (kind + identity), profile completion fields (kind-branched), vibe tag selection, vibe invite count.
5. Controller builds a completion snapshot and maps steps to cards.
6. Cards are rendered via `OnboardingCardList` and `OnboardingCard`.
7. When all steps are complete, `OnboardingCardsView` returns null — the card list disappears silently with no user message.
8. While loading: `OnboardingCardsSkeleton` renders 3 animated pulse cards.
9. On error: error banner + Retry button rendered.

Source: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (Error/loading/empty states), ARCHITECTURE.md §MODULE RUNTIME READINESS, modules/flow/ARCHITECTURE.md §Onboarding Cards Path

### Happy Path 2 — Vibe Tag Selection
1. Actor taps the vibe tags card CTA, navigating to `CitizenVibesScreen` at `/citizen/vibes`.
2. `useOnboardingVibeTags` hook is initialized; `actorId` sourced from `useIdentity()`.
3. `CitizenVibesScreen` renders `VibeTagPicker` component.
4. Actor selects vibe tags.
5. Hook `save()` method calls `saveVibeTagsOnboardingController({ actorId, selectedTagIds })`.
6. Controller calls `replaceSelectedVibeTagsDAL`: first voids all existing tags for the actor (UPDATE), then upserts the new selection (UPSERT) — two sequential operations, not wrapped in a transaction.
7. Tag replacement completes (or fails with a data integrity gap if the upsert fails after void succeeds).

Source: modules/flow/ARCHITECTURE.md §Vibe Tag Selection Path, ARCHITECTURE.md §MODULE DATA CONTRACT, INDEX.md §Write Surface Map

### Happy Path 3 — Onboarding Completion (auth layer)
This path originates in the `auth` feature's onboarding controller, not the onboarding feature's own controllers.

1. Actor completes the onboarding form (display name, username, birthdate).
2. `useAuthOnboarding` hook calls `completeOnboardingController({ userId, form })`.
3. Controller fetches the active Supabase session and cross-checks `userId === user.id`. Mismatch causes early return with login redirect. (Session-pinned — BLOCKED adversarially.)
4. `upsertCompletedOnboardingProfileDAL` writes to `public.profiles`.
5. `generateUsernameDAL` (RPC) generates username.
6. `createUserActorForProfile` and `ensureVcsmPlatformBootstrap` are called.
7. Hydration refresh triggered via `refreshVcActorDirectory` through the identity adapter.

Source: BW adversarial report §A.3, §I (Inferred Invariant 2), §G.1; modules/flow/INDEX.md

### Known Flow Gap
`markActorOnboardingStepCompletedDAL` is the function expected to record per-step completion to `vc.actor_onboarding_steps`. However, no controller or hook in this feature calls it. The function is an exported dead write surface. How individual onboarding steps are marked complete in the runtime flow is UNKNOWN — the DAL exists but has no confirmed caller chain.

Source: ARCHITECTURE.md §MODULE MISSING PIECES, INDEX.md §Security-Sensitive Surfaces, VEN-ONBOARDING-002, BW-ONBOARD-002

---

## §4 Business Rules

**RULE-001:** Onboarding cards are shown to any authenticated actor with incomplete onboarding steps. The `OnboardingCardsView` component auto-hides (returns null) when all steps are complete.
- Source: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (empty state row), §MODULE RUNTIME READINESS

**RULE-002:** Actor kind determines which profile completion fields are checked. `user` kind reads from citizen/user profile fields; `vport` kind reads from vport profile fields. Profile reads do not cross actor kind boundaries.
- Source: ARCHITECTURE.md §MODULE DEPENDENCY GRAPH, BW adversarial report §C.1, §I (Inferred Invariant 4) — adversarially BLOCKED

**RULE-003:** The invite card (`invite_first_citizen`) is permanently disabled. `SHOW_INVITE_ONBOARDING_CARD` is hardcoded `false`. The invite CTA path (`/invite`) is unreachable from this feature.
- Source: ARCHITECTURE.md §MODULE RUNTIME READINESS (runtime dependencies row), §MODULE MISSING PIECES (SHOW_INVITE_ONBOARDING_CARD row)

**RULE-004:** Vibe tag selection is a replace-all operation. Existing tags for the actor are voided before new selections are upserted. There is no additive or merge mode.
- Source: INDEX.md §Write Surface Map, ARCHITECTURE.md §MODULE DATA CONTRACT (vc.vibe_actor_tags row)

**RULE-005:** Onboarding step configuration is read from the database (`vc.onboarding_steps`) with fallbacks in `STEP_DEFAULTS`. Steps are not hardcoded.
- Source: ARCHITECTURE.md §MODULE DATA CONTRACT (vc.onboarding_steps row)

**RULE-006:** CTA paths in onboarding cards are static strings. No raw UUIDs or actorIds are interpolated into CTA URLs.
- Source: BW adversarial report §H.1 — adversarially BLOCKED

**RULE-007:** `invite_code` values are selected at the DAL layer but stripped by `mapVibeInviteRow` in the model before being surfaced. Invite codes are never returned in the onboarding card response.
- Source: BW adversarial report §H.2 — adversarially BLOCKED

**RULE-008:** On error during onboarding card load, an error banner and Retry button are rendered. Silent failure is not acceptable for the card loading path.
- Source: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (Error/loading/empty states row — PASS)

**RULE-009:** The `feed` feature also writes to `vc.actor_onboarding_steps` via `markWelcomeFeedCardSeenDAL`. This is a shared DB table with shared write ownership. Changes to the step schema require coordination with the feed feature.
- Source: ARCHITECTURE.md §MODULE DATA CONTRACT (vc.actor_onboarding_steps row), §MODULE BOUNDARY WARNINGS

**RULE-010:** `completeOnboardingController` uses upsert semantics with no idempotency guard. Replaying onboarding completion overwrites profile fields and re-triggers username generation.
- Source: BW adversarial report §F.1, finding BW-ONBOARD-005

---

## §5 State Rules

The following state transitions are derivable from governance artifacts:

### Onboarding Card Visibility States
| State | Condition | UI Behavior |
|---|---|---|
| LOADING | Steps loading from DB | `OnboardingCardsSkeleton` — 3 animated pulse cards |
| ERROR | DAL call failure during load | Error banner + Retry button rendered |
| CARDS_VISIBLE | At least one step incomplete | Card list rendered |
| ALL_COMPLETE | All steps complete | `OnboardingCardsView` returns null — no UI |
| EMPTY (step count 0) | No cards loaded (possibly error) | Returns null silently — no user feedback |

Source: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (Error/loading/empty states — PASS), §MODULE RUNTIME READINESS (Empty state row note: "Silently hides; no user feedback if zero cards loaded due to error")

### Vibe Tag State
| State | Trigger |
|---|---|
| PRE_SELECTION | Actor has not yet selected tags (or tags were voided) |
| VOIDED | replaceSelectedVibeTagsDAL step 1 completes (UPDATE: is_void = true for all actor tags) |
| REPLACED | replaceSelectedVibeTagsDAL step 2 completes (UPSERT new tags) |
| PARTIAL_FAILURE | Step 1 succeeds, step 2 fails — actor has no tags; data integrity gap |

Source: ARCHITECTURE.md §MODULE MISSING PIECES (replaceSelectedVibeTagsDAL row), INDEX.md §Security-Sensitive Surfaces, BW-ONBOARD-006

### Onboarding Step Completion State
Individual step completion states are written to `vc.actor_onboarding_steps` with status `'completed'` via upsert (conflict key: `actor_id, step_key`). The specific step-key enumeration and the runtime path that triggers step writes are UNKNOWN — `markActorOnboardingStepCompletedDAL` exists but has no confirmed callers.

Source: INDEX.md §Write Surface Map, VEN-ONBOARDING-002

---

## §6 Security Constraints

The following constraints are derived directly from VENOM and BlackWidow findings. Each represents a required security property of the feature.

**CONSTRAINT-001:** Vibe tag writes to `vc.vibe_actor_tags` must be scoped to the actor owned by the authenticated Supabase session. A write targeting a different actor's `actorId` must never succeed.
- Evidence: VEN-ONBOARDING-001 (HIGH) — replaceSelectedVibeTagsDAL writes with client-supplied actorId; no ownership verification; RLS unverified

**CONSTRAINT-002:** The `markActorOnboardingStepCompletedDAL` write surface must never be callable without session-verified actor ownership. Callers must prove ownership before the upsert executes.
- Evidence: VEN-ONBOARDING-002 (HIGH) — dead exported write surface, no callers, no ownership check; onboarding step forgery risk

**CONSTRAINT-003:** `profileId` and `vportId` must never be exposed above the DAL/model boundary. They must not appear in controller return values, hook return values, or any surface accessible to consuming components.
- Evidence: VEN-ONBOARDING-003 (MEDIUM) — profileId + vportId surfaced into controller layer via mapActorRow — architecture contract violation

**CONSTRAINT-004:** No `console.log` or `console.error` call may emit `actorId` or Supabase error details in production builds (without `import.meta.env.DEV` guard).
- Evidence: VEN-ONBOARDING-004 (LOW) — stale DEV PROBE console.log with actorId in vibeInvites.dal.js and useOnboardingCards.js; VEN-ONBOARDING-005 (MEDIUM) — production console.error in logOnboardingStepFailure emits actorId + raw Supabase error details with no DEV guard; BW-ONBOARD-007 (INFO), BW-ONBOARD-008 (INFO)

**CONSTRAINT-005:** `getOnboardingCardsController` must verify that the calling Supabase session owns the supplied `actorId` before executing any DAL reads. A null check alone is insufficient.
- Evidence: VEN-ONBOARDING-006 (MEDIUM) — getOnboardingCardsController has no session verification; null check only on client-supplied actorId before 7 parallel DAL calls; BW-ONBOARD-003 (MEDIUM)

**CONSTRAINT-006:** `saveVibeTagsOnboardingController` must re-verify session ownership of the supplied `actorId` inside the controller. Session derivation at the hook level is insufficient — the controller must not trust the caller parameter without independent session verification.
- Evidence: BW-ONBOARD-001 (HIGH) — adversarially BYPASSED; saveVibeTagsOnboardingController accepts actorId from parameter with no session re-verification

**CONSTRAINT-007:** RLS on `vc.vibe_actor_tags` must enforce `auth.uid()` ownership. Query-level filters alone are insufficient if table-level RLS is absent or misconfigured.
- Evidence: BW-ONBOARD-004 (HIGH) — vc.vibe_actor_tags RLS status unverified; UNRESOLVED

**CONSTRAINT-008:** `completeOnboardingController` (auth feature) must always cross-check the supplied `userId` against the active Supabase session `user.id` before executing any writes. Mismatch must cause immediate rejection with a login redirect.
- Evidence: BW adversarial report §A.3 — this is a BLOCKED invariant; session cross-check confirmed present. Constraint documented to preserve the protection.

---

## §7 Error Handling

The following error states and fallbacks are documentable from governance artifacts:

| Error Scenario | Handling | Source |
|---|---|---|
| DAL call failure during onboarding card load | Error banner + Retry button rendered in `OnboardingCardsView` | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (Error/loading/empty states — PASS) |
| `actorId` is null/undefined passed to `getOnboardingCardsController` | Returns `{ ok: false }` immediately; does not reach DAL | BW adversarial report §E.2 |
| `actorId` is null/undefined passed to `saveVibeTagsOnboardingController` | Returns `{ ok: false, error: { message: 'Missing actorId' } }` | BW adversarial report §E.1 |
| `actorId` is null/undefined passed to `replaceSelectedVibeTagsDAL` directly | Throws `Error('actorId is required')` | BW adversarial report §E.3 |
| `userId` does not match active session in `completeOnboardingController` | Returns login redirect action; does not write | BW adversarial report §A.3 |
| `replaceSelectedVibeTagsDAL` upsert fails after void succeeds | Partial failure state: actor has no vibe tags. No automatic rollback. | ARCHITECTURE.md §MODULE MISSING PIECES, INDEX.md §Security-Sensitive Surfaces |
| Zero cards loaded (empty step config or all complete) | `OnboardingCardsView` returns null silently. No user feedback distinguishing "all done" from "zero loaded due to error." | ARCHITECTURE.md §MODULE RUNTIME READINESS (Empty state row) |
| `logOnboardingStepFailure` called on DAL error | `console.error` emits actorId + Supabase error details in all environments (no DEV guard — open vulnerability VEN-ONBOARDING-005) | SECURITY.md, VEN-ONBOARDING-005 |

What specific DAL-level errors surface to the hook `error` state (and trigger the error banner) vs. are silently swallowed by the `loadStep` wrapper is UNKNOWN from governance artifacts.

---

## §8 Cross-Feature Dependencies

| Dependency | Type | Direction | Boundary | Status | Source |
|---|---|---|---|---|---|
| `engines/identity` (via `identity.adapter`) | Engine | onboarding → identity | Adapter boundary — correct per contract | PASS | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| `engines/profile` | Engine | onboarding → profile | Consumed via DAL reads to `vc.profiles` | PASS | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| `features/identity` (useIdentity hook) | Feature adapter | onboarding → identity.adapter | Adapter boundary — correct | PASS | ARCHITECTURE.md §MODULE BOUNDARY WARNINGS |
| `features/auth` (onboarding.controller.js) | Feature | auth → onboarding (DAL call) | Auth feature's onboarding controller calls onboarding DALs | DEPENDENCY EXISTS | BW adversarial report §A.3, §4 Hook Entry Points |
| `features/feed` (markWelcomeFeedCardSeenDAL) | Feature DB table | feed → vc.actor_onboarding_steps | Shared table write — not a code import; shared ownership risk | WATCH | ARCHITECTURE.md §MODULE DATA CONTRACT, §MODULE BOUNDARY WARNINGS |
| `features/settings` | Feature route | CTA only | onboarding cards CTA navigates to `/settings?tab=profile` | EXTERNAL | INDEX.md §Routes |
| `features/invite` | Feature route | CTA only (dead) | onboarding cards CTA navigates to `/invite` — invite card permanently hidden | DEAD | INDEX.md §Routes, ARCHITECTURE.md §MODULE RUNTIME READINESS |

**Independence status:** MOSTLY INDEPENDENT — source code imports are contained within the adapter boundary. Shared DB table ownership with feed feature is the primary cross-feature risk.

Source: CURRENT_STATUS.md, ARCHITECTURE.md §MODULE BOUNDARY WARNINGS and §MODULE DEPENDENCY GRAPH

---

## §9 Must Never Happen — Security Invariants

These invariants are anchored to confirmed VENOM and BlackWidow findings. Items marked BYPASSED mean adversarial testing confirmed the invariant is currently violated.

**INVARIANT-001:** An authenticated actor must never be able to write vibe tags for a different actor's actorId.
- Current status: BYPASSED — Violated by: VEN-ONBOARDING-001, BW-ONBOARD-001
- THOR blocker: YES (VEN-ONBOARDING-001, BW-ONBOARD-001)

**INVARIANT-002:** Onboarding step completion must never be writable for an arbitrary actor without verified session ownership.
- Current status: BYPASSED — Violated by: VEN-ONBOARDING-002, BW-ONBOARD-002
- Note: `markActorOnboardingStepCompletedDAL` is an exported dead write surface — any importing module can forge step completion for any actor.
- THOR blocker: YES (VEN-ONBOARDING-002, BW-ONBOARD-002 — severity escalated to CRITICAL by BlackWidow)

**INVARIANT-003:** The `vc.vibe_actor_tags` table must have RLS enforcing `auth.uid()` ownership. A foreign authenticated session must never succeed in writing tags for a different actor at the DB level.
- Current status: UNRESOLVED — RLS presence unconfirmed — Violated by: BW-ONBOARD-004
- THOR blocker: YES (BW-ONBOARD-004)

**INVARIANT-004:** `profileId` and `vportId` must never appear in controller-layer return values, hook return values, or component props. They are internal identity fields banned from public surfaces by the VCSM architecture contract.
- Current status: OPEN (contained but pattern violation exists) — Violated by: VEN-ONBOARDING-003
- THOR blocker: NO (but pre-release fix required per VENOM)

**INVARIANT-005:** `actorId` must never be emitted to `console.log` or `console.error` in production builds. Raw Supabase error details (message, code, details, hint) must never be emitted without a `import.meta.env.DEV` guard.
- Current status: BYPASSED in production — Violated by: VEN-ONBOARDING-005, BW-ONBOARD-007, BW-ONBOARD-008
- THOR blocker: NO (but pre-release fix recommended)

**INVARIANT-006:** An actor must never be able to view another actor's onboarding completion state, vibe tags, profile completion fields, or invite data by supplying a foreign actorId to `getOnboardingCardsController`.
- Current status: OPEN (no session verification at controller entry) — Violated by: VEN-ONBOARDING-006, BW-ONBOARD-003
- THOR blocker: NO (but pre-release fix recommended)

**INVARIANT-007:** Profile completion writes (via `completeOnboardingController` in the auth feature) must never execute for a `userId` that does not match the active Supabase session `user.id`.
- Current status: BLOCKED — cross-check is present and adversarially confirmed. Invariant is currently enforced.
- Finding: BW adversarial report §A.3 (BLOCKED)

**INVARIANT-008:** Profile reads must never cross actor kind boundaries. A `vport` actor's completion check must never read citizen profile fields, and vice versa.
- Current status: BLOCKED — kind-gated branching is present and adversarially confirmed.
- Finding: BW adversarial report §C.1, §I Inferred Invariant 4 (BLOCKED)

**INVARIANT-009:** CTA paths in onboarding cards must never contain raw UUIDs or actorId values.
- Current status: BLOCKED — all CTA paths are static strings; adversarially confirmed.
- Finding: BW adversarial report §H.1 (BLOCKED)

**INVARIANT-010:** `invite_code` values must never be surfaced above the model layer. They must be stripped in `mapVibeInviteRow` before any controller or hook return.
- Current status: BLOCKED — adversarially confirmed.
- Finding: BW adversarial report §H.2 (BLOCKED)

---

## §10 Module Responsibilities

The onboarding feature has one module documented in governance: `flow`.

### Module: flow
**Path:** `apps/VCSM/src/features/onboarding/`
**Status:** STUB governance (INDEX.md, BEHAVIOR.md, ARCHITECTURE.md, SECURITY.md all STUB)
**Source:** modules/flow/INDEX.md, modules/flow/ARCHITECTURE.md

**Responsibilities (provable from flow module governance):**
- Vibe tag selection: CitizenVibesScreen → VibeTagPicker → useOnboardingVibeTags → saveVibeTagsOnboardingController → replaceSelectedVibeTagsDAL → vc.vibe_actor_tags
- Onboarding cards display: OnboardingCardsView → useOnboardingCards → getOnboardingCardsController → 7 parallel DAL reads → card models
- Step completion write: onboardingSteps.dal.js → markActorOnboardingStepCompletedDAL (dead — no active caller chain confirmed)
- Profile completion reads: profileCompletion.dal.js → vc.profiles (kind-gated)
- Model transformation: onboarding.model.js — all mappers and snapshot builders (207 lines — approaching split threshold)
- Adapter export: onboarding.adapter.js — exports OnboardingCardsView and CitizenVibesScreen

**THOR blockers active in this module:** FLOW-SEC-001 (HIGH), FLOW-SEC-002 (CRITICAL), FLOW-SEC-003 (HIGH)
Source: modules/flow/SECURITY.md, modules/flow/INDEX.md §THOR Status

**Specific module behavior for each sub-component:** UNKNOWN — the flow module's own BEHAVIOR.md is a STUB with unverified expected behaviors only. No authoritative behavior contract existed at the module level prior to this document.

---

## §11 Known Gaps

### UNKNOWN Sections
The following items could not be resolved from governance artifacts:

1. **Step key enumeration** — The specific step keys used in `vc.actor_onboarding_steps` (beyond `complete_citizen_card`, `set_vibe_tags`, `invite_first_citizen` implied by STEP_DEFAULTS reference in ARCHITECTURE.md) are not fully documented in governance artifacts.

2. **markActorOnboardingStepCompletedDAL caller chain** — How and when individual onboarding steps are marked complete in the live runtime is UNKNOWN. The DAL exists and is exported but has no confirmed callers in governance documentation.

3. **Step-level completion criteria** — What constitutes "completed" for each step (e.g., minimum profile fields required to mark `complete_citizen_card`) is not documented in governance artifacts.

4. **Supabase RLS status for vc.actor_onboarding_steps** — Whether this table has RLS enforcing session ownership on writes is UNVERIFIED. Both VENOM and BlackWidow flag this as unconfirmed.

5. **Supabase RLS status for vc.vibe_actor_tags** — Whether this table has RLS enforcing session ownership on writes is UNVERIFIED (BW-ONBOARD-004, FLOW-SEC-003).

6. **Error details swallowed by loadStep wrapper** — Which specific DAL failure conditions surface to the hook error state vs. are silently swallowed is not documented in governance artifacts.

7. **completeOnboardingController upsert target fields** — The specific profile fields written by `upsertCompletedOnboardingProfileDAL` are not enumerated in governance artifacts (only referenced as "display_name, username, birthdate" in BW-ONBOARD-005 context).

8. **Module-level behavior specifics for flow module** — The flow module's BEHAVIOR.md is a STUB. All module-level behavior in §10 is derived from the feature-level architecture and security documents, not from a confirmed module behavior contract.

### Missing Governance
- `OWNERSHIP.md` — MISSING (no formal ownership record; ownership inferred from ARCHITECTURE.md as "VCSM platform team — identity and activation domain")
- `TESTS.md` — MISSING (0 tests confirmed by scanner; no test governance file)
- ELEKTRA has NOT been run on this feature
- DB audit for RLS on `vc.vibe_actor_tags` and `vc.actor_onboarding_steps` is outstanding
- Runtime audit — MISSING
- Performance audit — MISSING
- Migration audit — MISSING

### Open Tickets Referenced in Governance
- `TICKET-ZZ-SCANNER-MAPPED-FOLDERS-0001` — original folder skeleton ticket (README.md)
- `TICKET-BOOKING-RPC-001` — referenced in platform memory (related pattern — RPC migration for typed writes)
- `TICKET-PLATFORM-RLS-001` — referenced in platform memory (RLS cleanup)

### Dead Code
- `SHOW_INVITE_ONBOARDING_CARD` — hardcoded `false`; invite card permanently hidden; no feature flag management
- `markActorOnboardingStepCompletedDAL` — dead exported write surface; no confirmed callers in feature

### Architecture Concerns
- `replaceSelectedVibeTagsDAL` — non-atomic two-operation write (void-all then upsert) without a DB transaction
- `onboarding.model.js` — 207 lines; approaching split threshold per ARCHITECTURE.md
- `onboarding.controller.helpers.js` — service-like logic in a helpers file; no formal service layer
- 0 test files — no regression net for a module with complex parallel snapshot logic and kind-branching

---

## §12 Validation Sources

| File | Read | Key Facts Extracted |
|---|---|---|
| ZZnotforproduction/APPS/VCSM/features/onboarding/CURRENT_STATUS.md | YES | Architecture state STABLE; Independence MOSTLY INDEPENDENT; Completeness MOSTLY COMPLETE; Spaghetti WATCH; Top gap: BEHAVIOR.md is placeholder |
| ZZnotforproduction/APPS/VCSM/features/onboarding/SECURITY.md | YES | Highest open severity CRITICAL; THOR blocked by VEN-ONBOARDING-001, VEN-ONBOARDING-002, BW-ONBOARD-001, BW-ONBOARD-002, BW-ONBOARD-004; 6 VENOM findings (0 CRITICAL, 2 HIGH, 3 MEDIUM, 1 LOW); 9 BW findings (1 CRITICAL, 2 HIGH, 1 MEDIUM, 2 LOW, 3 INFO); ELEKTRA NOT RUN |
| ZZnotforproduction/APPS/VCSM/features/onboarding/ARCHITECTURE.md | YES | Full module architecture, layer map, dependency graph, data contract, runtime readiness, missing pieces, spaghetti score, boundary warnings |
| ZZnotforproduction/APPS/VCSM/features/onboarding/INDEX.md | YES | Source inventory, write surface map, security-sensitive surfaces, engine dependencies, routes, documentation links |
| ZZnotforproduction/APPS/VCSM/features/onboarding/SCREENS.md | YES | 2 screens: CitizenVibesScreen (route-linked at /citizen/vibes, public), OnboardingCardsView (unlinked, unknown-screen) |
| ZZnotforproduction/APPS/VCSM/features/onboarding/README.md | YES | Placeholder only — scaffold ticket reference |
| ZZnotforproduction/APPS/VCSM/features/onboarding/modules/flow/BEHAVIOR.md | YES | STUB — unverified expected behaviors, unverified invariants, TODO list |
| ZZnotforproduction/APPS/VCSM/features/onboarding/modules/flow/ARCHITECTURE.md | YES | Vibe tag selection path, onboarding cards path, dead write surface, PII leak paths, model leak |
| ZZnotforproduction/APPS/VCSM/features/onboarding/modules/flow/INDEX.md | YES | Full source file list, governance file status, THOR status |
| ZZnotforproduction/APPS/VCSM/features/onboarding/modules/flow/SECURITY.md | YES | 7 security findings (FLOW-SEC-001 through FLOW-SEC-007), THOR blockers FLOW-SEC-001/002/003, ELEKTRA not run |
| ZZnotforproduction/APPS/VCSM/features/onboarding/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_onboarding-security-review.md | YES | Full VENOM V2 report — 6 findings with source citations, THOR impact table, mitigation plan |
| ZZnotforproduction/APPS/VCSM/features/onboarding/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_onboarding-adversarial-review.md | YES | Full BW adversarial report — 9 findings, adversarial path analysis (A through I), §9 invariant attack map |

---

## §13 THOR Release Status

**THOR Release Status: BLOCKED**

From SECURITY.md:
> THOR Release Blocker: YES — VEN-ONBOARDING-001, VEN-ONBOARDING-002, BW-ONBOARD-001, BW-ONBOARD-002, BW-ONBOARD-004

From VENOM report (§10 THOR Impact):
> THOR Release Status: BLOCKED pending resolution of VEN-ONBOARDING-001 and VEN-ONBOARDING-002.

From BlackWidow report (§12 THOR Impact):
> Total THOR blockers: 3 (2 confirmed, 1 escalated)

### Active THOR Blockers

| Blocker ID | Severity | Description | Status |
|---|---|---|---|
| VEN-ONBOARDING-001 / BW-ONBOARD-001 | HIGH | replaceSelectedVibeTagsDAL / saveVibeTagsOnboardingController — vibe tag write accepts foreign actorId; no session pin at controller layer; ownership bypass adversarially BYPASSED | OPEN |
| VEN-ONBOARDING-002 / BW-ONBOARD-002 | CRITICAL (escalated by BW) | markActorOnboardingStepCompletedDAL — dead exported write surface; no controller wrapper; no ownership check; no session verification; step forgery for any actor adversarially BYPASSED | OPEN |
| BW-ONBOARD-004 | HIGH | vc.vibe_actor_tags RLS status UNVERIFIED; query-level filter exists but table-level RLS unconfirmed; combined with BW-ONBOARD-001, full ownership bypass possible if RLS absent | UNRESOLVED |

### Pre-Release Recommended (Non-Blocking)
- VEN-ONBOARDING-006 / BW-ONBOARD-003 — session verification missing from getOnboardingCardsController
- VEN-ONBOARDING-005 / BW-ONBOARD-007/008 — actorId + Supabase error details in production console.error
- VEN-ONBOARDING-003 — profileId/vportId architecture contract violation in controller layer

### Required Before THOR Clearance
1. DB audit: verify and enforce RLS on `vc.vibe_actor_tags` (BW-ONBOARD-004)
2. DB audit: verify RLS on `vc.actor_onboarding_steps` (VEN-ONBOARDING-002)
3. Resolve `replaceSelectedVibeTagsDAL` ownership — add RLS or migrate to RPC (VEN-ONBOARDING-001)
4. Resolve `markActorOnboardingStepCompletedDAL` — delete or gate with RPC + ownership check (VEN-ONBOARDING-002)
5. SPIDER-MAN regression tests: SM-ONBOARD-001, SM-ONBOARD-002 (P0 per BW report §13)
6. ELEKTRA run — not yet executed on this feature

**Module flow THOR blockers:** FLOW-SEC-001, FLOW-SEC-002, FLOW-SEC-003 (maps to same findings above)
Source: modules/flow/SECURITY.md, modules/flow/INDEX.md §THOR Status
