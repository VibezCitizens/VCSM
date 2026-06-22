# Runtime Feature Index: onboarding

## Metadata
| Field | Value |
|---|---|
| Feature | onboarding |
| CURRENT Folder | CURRENT/features/onboarding |
| Source Folder | apps/VCSM/src/features/onboarding |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| Last ARCHITECT Run | 2026-06-02 (ARCHITECT-ONBOARDING-0001) |

## Source Inventory
| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 3 | onboarding.controller.js, vibeTagsOnboarding.controller.js, onboarding.controller.helpers.js |
| DALs | 4 | onboardingSteps.dal.js, profileCompletion.dal.js, vibeInvites.dal.js, vibeTags.dal.js |
| Hooks | 2 | useOnboardingCards.js, useOnboardingVibeTags.js |
| Models | 1 | onboarding.model.js |
| Screens | 2 | OnboardingCardsView.jsx, CitizenVibesScreen.jsx |
| Components | 3 | OnboardingCard.jsx, OnboardingCardList.jsx, VibeTagPicker.jsx |
| Adapters | 1 | onboarding.adapter.js |
| Routes | 2 | /onboarding (OnboardingCardsView), /citizen/vibes (CitizenVibesScreen) |
| Tests | 0 | NONE FOUND |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /onboarding | apps/VCSM/src/features/onboarding/screens/OnboardingCardsView.jsx | AUTH | Post-registration onboarding card dashboard; reads actorId from useIdentity; hides itself when allCompleted |
| /citizen/vibes | apps/VCSM/src/features/onboarding/screens/CitizenVibesScreen.jsx | AUTH | Vibe tag selection screen; post-registration step; navigates to /explore on save |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| replaceSelectedVibeTagsDAL | dal/vibeTags.dal.js | UPDATE (void) + UPSERT — vc.vibe_actor_tags | NO — actorId param only; no session ownership check | MEDIUM |
| markActorOnboardingStepCompletedDAL | dal/onboardingSteps.dal.js | UPSERT — vc.actor_onboarding_steps | NO — exported but not called from any onboarding controller (may be orphaned or consumed externally) | MEDIUM |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| replaceSelectedVibeTagsDAL | dal/vibeTags.dal.js | OWNERSHIP — no app-layer session match | No VENOM/CARNAGE audit; RLS WITH CHECK on vc.vibe_actor_tags unconfirmed |
| markActorOnboardingStepCompletedDAL | dal/onboardingSteps.dal.js | OWNERSHIP + ORPHAN RISK | Defined but not called in-feature; external consumers unknown; vc.actor_onboarding_steps RLS WITH CHECK unconfirmed (also flagged by Feed V3 CARNAGE task) |
| readQualifyingVibeInviteCountDAL | dal/vibeInvites.dal.js | DEV PROBE — non-production-safe log | console.log guarded by import.meta.env.DEV — present but not cleaned up |
| saveVibeTagsOnboardingController | controller/vibeTagsOnboarding.controller.js | WRITE — actorId-only gate | actorId null check only; no session ownership verification |
| getOnboardingCardsController | controller/onboarding.controller.js | READ — invite card dead-weight | SHOW_INVITE_ONBOARDING_CARD=false but 3 invite-related DAL calls still execute unconditionally |

## Architecture Risk Summary
| Risk | Severity | Evidence |
|---|---|---|
| Invite card DAL calls execute despite card being suppressed | LOW-MEDIUM | SHOW_INVITE_ONBOARDING_CARD=false; 3 invite DAL calls run on every onboarding load |
| markActorOnboardingStepCompletedDAL — orphaned export | MEDIUM | Defined in onboardingSteps.dal.js; not imported by any onboarding controller |
| No session ownership check on write controllers | MEDIUM | actorId param only; depends entirely on unconfirmed RLS WITH CHECK |
| Dev probe console.log in vibeInvites.dal.js | LOW | Guarded by DEV env; not production-shipping but stale |
| useOnboardingCards vs useOnboardingVibeTags — inconsistent actorId sourcing | LOW | Cards hook receives actorId as prop; VibeTags hook reads from useIdentity internally |
| Zero test coverage | MEDIUM | 0 test files; 8 model functions, 3 controllers, 4 DALs untested |

## Governance Status
| File | Status |
|---|---|
| ARCHITECTURE.md | PRESENT — generated 2026-06-02 |
| DR_STRANGE.md | PRESENT |
| vcsm.onboarding.architecture.md | PRESENT (legacy module report) |
| SECURITY.md | MISSING |
| CURRENT_STATUS.md | MISSING |
| OWNERSHIP.md | MISSING |
| TESTS.md | MISSING |
| PERFORMANCE.md | MISSING |
| BLOCKERS.md | MISSING |
| DEFERRED.md | MISSING |
| HISTORY_INDEX.md | MISSING |

## Recommended Next Command

**VENOM** — Write surface trust boundary audit. `replaceSelectedVibeTagsDAL` writes to `vc.vibe_actor_tags` with actorId-only gate; RLS WITH CHECK on write tables unconfirmed. Security tier is MEDIUM; feature is ACTIVE and wired into auth registration pipeline.

## Recommended Next Ticket

TICKET-ONBOARDING-VENOM-001 — Run VENOM security audit on write surfaces: `vc.vibe_actor_tags` (replaceSelectedVibeTagsDAL), `vc.actor_onboarding_steps` (markActorOnboardingStepCompletedDAL). Coordinate with CARNAGE on vc.actor_onboarding_steps RLS (also flagged by Feed V3 task). Resolve orphaned DAL export question with IRONMAN.
