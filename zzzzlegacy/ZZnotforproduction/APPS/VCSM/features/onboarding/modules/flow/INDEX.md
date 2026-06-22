---
title: Flow Module — Index
status: STUB
feature: onboarding
module: flow
source: venom+bw-derived
created: 2026-06-05
---

# onboarding / modules / flow

Full onboarding flow — vibe tag selection, onboarding step completion, profile completion status, card display. Serves new actors immediately after registration.

## Source Files

| File | Layer |
|---|---|
| adapters/onboarding.adapter.js | adapter |
| components/OnboardingCard.jsx | UI |
| components/OnboardingCardList.jsx | UI |
| components/VibeTagPicker.jsx | UI |
| controller/onboarding.controller.js | controller |
| controller/onboarding.controller.helpers.js | helpers |
| controller/vibeTagsOnboarding.controller.js | controller |
| dal/onboardingSteps.dal.js | write DAL |
| dal/profileCompletion.dal.js | read DAL |
| dal/vibeInvites.dal.js | read DAL |
| dal/vibeTags.dal.js | write DAL |
| hooks/useOnboardingCards.js | hook |
| hooks/useOnboardingVibeTags.js | hook |
| model/onboarding.model.js | model |
| screens/CitizenVibesScreen.jsx | screen |
| screens/OnboardingCardsView.jsx | view |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — FLOW-SEC-001 (HIGH), FLOW-SEC-002 (CRITICAL), FLOW-SEC-003 (HIGH)
