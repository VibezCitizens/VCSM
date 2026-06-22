---
title: Flow Module — Architecture
status: STUB
feature: onboarding
module: flow
source: venom+bw-derived
created: 2026-06-05
---

# onboarding / modules / flow — ARCHITECTURE

## Vibe Tag Selection Path

```
CitizenVibesScreen → VibeTagPicker → useOnboardingVibeTags
  └── vibeTagsOnboarding.controller.js
        └── saveVibeTagsOnboardingController(actorId, tags)
              ├── actorId from parameter (no session cross-check) ← VEN-ONBOARDING-001 / BW-ONBOARD-001
              └── vibeTags.dal.js → replaceSelectedVibeTagsDAL
                    ├── vc.vibe_actor_tags void-all → upsert (non-atomic) ← BW-ONBOARD-006
                    └── RLS UNVERIFIED ← BW-ONBOARD-004
```

## Onboarding Cards Path

```
OnboardingCardsView → useOnboardingCards
  └── getOnboardingCardsController(actorId)
        ├── actorId null-check only (no session verify) ← VEN-ONBOARDING-006 / BW-ONBOARD-003
        └── 7 parallel DAL calls:
              ├── profileCompletion.dal.js → vc.profiles SELECT
              ├── vibeInvites.dal.js → vibe invite status
              └── onboardingSteps.dal.js → step completion status
```

## Dead Write Surface

```
onboardingSteps.dal.js → markActorOnboardingStepCompletedDAL
  └── EXPORTED with no controller wrapper, no ownership check, no callers ← BW-ONBOARD-002 CRITICAL
```

## PII Leak

```
vibeInvites.dal.js → DEV PROBE console.log (actorId) ← VEN-ONBOARDING-004
useOnboardingCards.js → console.error (actorId + error stack) ← BW-ONBOARD-008
logOnboardingStepFailure → console.error (actorId + Supabase error) ← VEN-ONBOARDING-005
```

## Model Leak

```
mapActorRow → profileId + vportId in controller layer ← VEN-ONBOARDING-003
```

## TODO

- [ ] Confirm vc.vibe_actor_tags RLS policy (SELECT + INSERT)
- [ ] Confirm onboardingSteps.dal.js caller list (check for any active callers)
