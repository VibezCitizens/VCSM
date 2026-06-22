# MODULE ARCHITECTURE REPORT

**Module:** onboarding
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Post-Registration Onboarding
**Primary Root:** `apps/VCSM/src/features/onboarding/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the post-registration onboarding experience: onboarding card steps (interests, actions, suggestions), vibe tag selection, and profile completion signaling. Consumed by auth feature during the registration flow.

---

## ENTRY POINTS

- `/onboarding` → `OnboardingCardsView.jsx`
- `/onboarding/vibes` → `CitizenVibesScreen.jsx`

---

## LAYER MAP

**DAL:** `onboardingSteps.dal.js`, `profileCompletion.dal.js`, `vibeInvites.dal.js`, `vibeTags.dal.js`

**Controller:** `onboarding.controller.js`, `onboarding.controller.helpers.js`, `vibeTagsOnboarding.controller.js`

**Hook:** `useOnboardingCards.js`, `useOnboardingVibeTags.js`

**Model:** `onboarding.model.js`

**Components:** `OnboardingCard.jsx`, `OnboardingCardList.jsx`, `VibeTagPicker.jsx`

**Screens:** `CitizenVibesScreen.jsx`, `OnboardingCardsView.jsx`

**Adapter:** `onboarding.adapter.js`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear | — |
| Controllers present | PASS | 3 controllers | — |
| DAL present | PASS | 4 DAL files | — |
| Hooks present | PASS | 2 hooks | — |
| Models present | PASS | 1 model | — |
| Screens/components present | PASS | 2 screens, 3 components | — |
| Adapter present | PASS | onboarding.adapter.js | — |
| Documentation | FAIL | No Logan doc | — |
| Tests | FAIL | None | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `vibeInvites.dal.js` | Invite-based onboarding — invite system removed per git history | MEDIUM — possibly dead | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- IRONMAN (ownership: vibeInvites.dal.js — is invite-based onboarding still active?)
- LOGAN (documentation)
