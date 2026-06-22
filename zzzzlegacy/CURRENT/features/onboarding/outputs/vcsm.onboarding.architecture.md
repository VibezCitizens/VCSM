---
# Module Architecture Report — vcsm.onboarding
# ARCHITECT §26.11 Dated Immutable Report
# Generated: 2026-06-02
# Ticket: ARCHITECT-ONBOARDING-0001
# Architecture State: STABLE
# Module Status: MOSTLY COMPLETE
# Security Tier: MEDIUM
---

## Feature Overview

The onboarding feature owns the post-registration onboarding experience for VCSM Citizens and Vports. It drives the onboarding card dashboard (profile completion, invite, vibe tags), the vibe tag selection screen, and all progress-state computation. It reads actor identity from the identity adapter and auth theme from the auth adapter. No engine dependency exists — all domain logic is self-contained within the feature. The feature is consumed by the auth feature during the registration pipeline (via `CitizenVibesScreen` and `OnboardingCardsView`).

**Source Path:** apps/VCSM/src/features/onboarding/
**Engine Path:** None — feature-only (no engines/ import found)
**Adapter:** apps/VCSM/src/features/onboarding/adapters/onboarding.adapter.js

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | apps/VCSM/src/features/onboarding/controller/ |
| DALs | YES | apps/VCSM/src/features/onboarding/dal/ |
| Models | YES | apps/VCSM/src/features/onboarding/model/ |
| Hooks | YES | apps/VCSM/src/features/onboarding/hooks/ |
| Screens | YES | apps/VCSM/src/features/onboarding/screens/ |
| Components | YES | apps/VCSM/src/features/onboarding/components/ |
| Adapters | YES | apps/VCSM/src/features/onboarding/adapters/onboarding.adapter.js |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers (3)

| Controller | Purpose | Auth Gate |
|---|---|---|
| onboarding.controller.js | `getOnboardingCardsController` — assembles all onboarding card data for a given actorId via 7 parallel DAL calls; builds CitizenCard, InviteCard (suppressed via `SHOW_INVITE_ONBOARDING_CARD = false`), and VibeTagsCard models; branches on actor.kind ('user' vs 'vport') for correct profile/vport completion data | `actorId` presence check only — no session ownership verification |
| vibeTagsOnboarding.controller.js | `getVibeTagsOnboardingController` — reads all vibe tags + actor's selected tags; `saveVibeTagsOnboardingController` — replaces selected vibe tags (void-and-replace pattern via DAL) | `actorId` presence check only — no session ownership verification |
| onboarding.controller.helpers.js | Pure utility: `STEP_DEFAULTS`, `SHOW_INVITE_ONBOARDING_CARD` flag (currently `false`), `formatRemainingLabel`, `getStepOrFallback`, `loadStep`, `resolveStepCtaPath` | N/A — utility module |

**Flag:** `SHOW_INVITE_ONBOARDING_CARD = false` suppresses the invite card UI but the 3 invite-related DAL calls in `getOnboardingCardsController` still execute unconditionally on every load.

---

## Active DALs (4)

| DAL | Tables | Notes |
|---|---|---|
| onboardingSteps.dal.js | `vc.onboarding_steps` (READ), `vc.actor_onboarding_steps` (READ + UPSERT) | `readOnboardingStepsDAL`, `readActorOnboardingStepDAL`, `markActorOnboardingStepCompletedDAL`; the UPSERT function is defined but not called from any controller in this feature — possible orphaned export |
| profileCompletion.dal.js | `vc.actors` (READ), `profiles` (READ — default schema), `vport.profiles` (READ — vportClient schema) | `readActorRowDAL`, `readProfileCompletionFieldsDAL`, `readVportCompletionFieldsDAL` — all read-only; uses two schema clients |
| vibeInvites.dal.js | `vc.vibe_invites` (READ) | `readVibeInvitesDAL`, `readVibeInviteCountDAL`, `readQualifyingVibeInviteCountDAL` — all read-only; contains stale dev-only `console.log` probe in `readQualifyingVibeInviteCountDAL` |
| vibeTags.dal.js | `vc.vibe_tags` (READ), `vc.vibe_actor_tags` (READ + UPDATE + UPSERT) | `readVibeTagsDAL`, `readSelectedVibeTagsDAL`; `replaceSelectedVibeTagsDAL` — void-and-replace write; no ownership check before write |

---

## Active Hooks (2)

| Hook | Calls | Purpose |
|---|---|---|
| useOnboardingCards.js | `getOnboardingCardsController` | Loads onboarding card list; actorId received as prop from parent screen; exposes `cards`, `loading`, `error`, `refresh` |
| useOnboardingVibeTags.js | `getVibeTagsOnboardingController`, `saveVibeTagsOnboardingController`, `useIdentity` | Loads and saves vibe tag selection; reads actorId from `useIdentity` internally; navigates to `/explore` on successful save |

---

## Engine Dependencies

None — no `from.*engines/` imports found in any onboarding source file.

---

## Cross-Feature Dependencies

| Feature | What is Imported | Direction | Via Adapter |
|---|---|---|---|
| identity | `useIdentity` from `@/features/identity/adapters/identity.adapter` | onboarding -> identity | YES |
| auth | `authTheme` from `@/features/auth/adapters/auth.adapter` | onboarding -> auth (screen + component) | YES |

Both cross-feature imports respect the adapter boundary contract.

---

## Authorization Pattern

Controllers gate on `actorId` presence only (null check returning `ok: false`). No `getAuthSession()` call, no `actor_owners` JOIN, and no session user vs. actorId comparison exists at the application layer. Write path in `replaceSelectedVibeTagsDAL` writes to `vc.vibe_actor_tags` scoped by `actorId` with no app-layer ownership confirmation. Authorization relies entirely on unconfirmed RLS WITH CHECK policies on write tables.

---

## Module Independence Classification

**MOSTLY INDEPENDENT**

Reason: All domain logic is self-contained. Cross-feature imports are two adapter-boundary reads only. No engine dependency. The feature is consumed by auth during registration but does not import auth internal layers.

---

## Architecture State

**STABLE**

Reason: Layer structure is complete and correctly ordered (DAL -> Model -> Controller -> Hook -> Component -> Screen). Adapter exports only screens. No circular imports. No cross-feature boundary violations. The suppressed invite card creating dead-weight DB execution is a known temporary hold, not an architectural defect.

---

## Known Structural Risks

1. **Invite card DAL calls execute despite card being suppressed.** `SHOW_INVITE_ONBOARDING_CARD = false` but `readVibeInvitesDAL`, `readQualifyingVibeInviteCountDAL`, and `readActorOnboardingStepDAL` for `invite_first_citizen` execute unconditionally on every `getOnboardingCardsController` call. These are wasted DB queries.

2. **`markActorOnboardingStepCompletedDAL` is a possibly orphaned export.** Defined in `onboardingSteps.dal.js` but not imported by any controller within this feature. May be dead code or have external consumers — requires IRONMAN verification.

3. **No ownership check at controller layer.** `saveVibeTagsOnboardingController` and any consumer of `markActorOnboardingStepCompletedDAL` accept an `actorId` parameter with no session match. RLS WITH CHECK on `vc.vibe_actor_tags` and `vc.actor_onboarding_steps` is unconfirmed.

4. **Dev-only `console.log` probe in `vibeInvites.dal.js`.** `readQualifyingVibeInviteCountDAL` contains a `console.log` guarded by `import.meta.env.DEV`. Not production-shipping but marked for removal.

5. **Inconsistent actorId sourcing across hooks.** `useOnboardingCards` receives actorId as a prop; `useOnboardingVibeTags` resolves actorId from `useIdentity` internally. Functional but inconsistent.

6. **Zero test coverage.** 0 test files found across 16 source files including 8 model transform functions, 3 controllers, and 4 DALs.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Feature overview clear; DR_STRANGE.md confirms scope | None |
| Owner defined | FAIL | OWNERSHIP.md absent; IRONMAN has never run | Run IRONMAN |
| Entry points mapped | PASS | Two screens with routes; adapter exports both | None |
| Controllers present | PASS | 3 controllers; all layers covered | Invite card suppression creates dead-weight execution |
| DAL/repository present | PASS | 4 DAL files; explicit column selects; no select('*') violations | `markActorOnboardingStepCompletedDAL` may be orphaned |
| Models/transformers | PASS | onboarding.model.js — 8 map/build functions; clean layer separation | None |
| Hooks/view models | PASS | 2 hooks; actorId guarded before controller calls | Inconsistent actorId sourcing between hooks |
| Screens/components | PASS | 2 screens + 3 components; skeleton and error states present | None |
| Authorization path mapped | PARTIAL | actorId null-check gates confirmed; no session ownership check at app layer | RLS WITH CHECK on write tables unconfirmed — requires CARNAGE |
| Engine dependencies mapped | PASS | No engine imports confirmed | None |
| Tests/validation noted | FAIL | 0 test files | No test coverage; SPIDER-MAN has never run |

---

## Recommended Handoffs

- **VENOM** — Primary: audit write surface trust boundaries. `replaceSelectedVibeTagsDAL` writes to `vc.vibe_actor_tags` with actorId-only gate. No ownership check at app layer. Security tier MEDIUM; feature ACTIVE and wired into auth registration.
- **CARNAGE** — Confirm RLS WITH CHECK policies on `vc.vibe_actor_tags` and `vc.actor_onboarding_steps`. Coordinate with Feed V3 CARNAGE deferred item which also targets `vc.actor_onboarding_steps`.
- **IRONMAN** — Establish ownership; verify if `markActorOnboardingStepCompletedDAL` has active external consumers; confirm whether vibeInvites DAL is live or dead.
- **SPIDER-MAN** — Zero test coverage on 8 model transform functions, 3 controllers, 4 DALs. High test ROI.

---

## Final Module Status

**MOSTLY COMPLETE**

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-ONBOARDING-0001
- Architecture State: STABLE
- Source Files Scanned: 16
- Controllers: 3
- DALs: 4
- Hooks: 2
- Models: 1
- Screens: 2
- Components: 3
- Adapters: 1
- Engine Dependencies: 0
- Test Files: 0
- Cross-Feature Imports: 2 (both via adapter boundary)
