---
name: vcsm.onboarding.index
description: VCSM onboarding feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / onboarding

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 8 (cg) / 3 (fm) | onboarding.controller.js, vibeTagsOnboarding.controller.js, onboarding.controller.helpers.js |
| DAL files | 12 (cg) / 4 (fm) | onboardingSteps.dal.js, vibeTags.dal.js, profileCompletion.dal.js, vibeInvites.dal.js |
| Hooks | 2 | useOnboardingCards.js, useOnboardingVibeTags.js |
| Models | 15 (cg) / 1 (fm) | onboarding.model.js — all mappers and snapshot builders in a single file |
| Screens | 5 (cg) / 2 (fm) | OnboardingCardsView.jsx, CitizenVibesScreen.jsx |
| Components | 4 (cg) / 3 (fm) | OnboardingCard.jsx, OnboardingCardList.jsx, VibeTagPicker.jsx |
| Adapters | 1 | onboarding.adapter.js — exports OnboardingCardsView and CitizenVibesScreen |
| Barrels | 2 (cg) | onboarding.adapter.js acts as feature barrel |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No entries in route-map; OnboardingCardsView embedded in feed; CitizenVibesScreen at /citizen/vibes not scanned |
| Total source files | 16 | From scanner sourceFileCount |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| upsert | vc | actor_onboarding_steps | markActorOnboardingStepCompletedDAL |
| update | vc | vibe_actor_tags | replaceSelectedVibeTagsDAL (step 1 — void existing) |
| upsert | vc | vibe_actor_tags | replaceSelectedVibeTagsDAL (step 2 — insert new) |

## Security-Sensitive Surfaces

**markActorOnboardingStepCompletedDAL** — writes completion status to `vc.actor_onboarding_steps` scoped by `actorId`. The `actorId` is passed from the controller which receives it from the identity hook. There is no server-side ownership verification in source — relies on Supabase RLS on the `vc.actor_onboarding_steps` table. If RLS is not enforced on this table, any authenticated user could mark any actor's steps complete.

**replaceSelectedVibeTagsDAL** — runs two sequential DB operations (update then upsert) on `vc.vibe_actor_tags` without a transaction. If the upsert fails after the update succeeds, the actor's vibe tags are cleared with none re-inserted. This is a data integrity risk, not a security risk, but it is flagged here as a mutation safety concern.

## Engine Dependencies

- identity (via `@/features/identity/adapters/identity.adapter` — useIdentity hook)
- profile (reads `vc.profiles` fields in profileCompletion.dal.js)

## Routes

No entries in route-map for this feature. Known runtime routes based on source:
- `/citizen/vibes` — CitizenVibesScreen (CTA target from set_vibe_tags onboarding card)
- `/settings?tab=profile` — external, owned by settings feature (CTA target from complete_citizen_card)
- `/invite` — external, owned by invite feature (CTA target from invite_first_citizen card — currently hidden)

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no actual contract) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
