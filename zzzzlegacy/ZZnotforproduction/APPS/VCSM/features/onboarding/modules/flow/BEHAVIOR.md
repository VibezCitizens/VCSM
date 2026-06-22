---
title: Flow Module — Behavior
status: STUB
feature: onboarding
module: flow
source: venom+bw-derived
created: 2026-06-05
---

# onboarding / modules / flow — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (BW-ONBOARD-009 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

- New actor lands on CitizenVibesScreen — selects vibe tags
- saveVibeTagsOnboardingController writes selected tags (actorId from parameter, no session bind)
- Onboarding cards displayed via getOnboardingCardsController (7 parallel DAL calls, actorId null-check only)
- Each completed step calls markActorOnboardingStepCompletedDAL (dead function — no controller wrapper)
- completeOnboardingController upsert finalizes profile (idempotency gap)

## Invariants (UNVERIFIED)

- Tag write must be scoped to authenticated actor (NOT enforced — BW-ONBOARD-001 BYPASSED)
- Onboarding step completion must require session ownership (NOT enforced — BW-ONBOARD-002 BYPASSED)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm onboarding step list and completion signal
- [ ] Confirm completeOnboardingController upsert target fields
