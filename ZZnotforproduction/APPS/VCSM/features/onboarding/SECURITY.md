# Security Posture — onboarding

Last Updated: 2026-06-04
Highest Open Severity: CRITICAL
THOR Release Blocker: YES — VEN-ONBOARDING-001, VEN-ONBOARDING-002, BW-ONBOARD-001, BW-ONBOARD-002, BW-ONBOARD-004

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

6 findings: 0 CRITICAL, 2 HIGH, 3 MEDIUM, 1 LOW

- VEN-ONBOARDING-001 | HIGH | replaceSelectedVibeTagsDAL writes with client-supplied actorId; no ownership verification; RLS unverified (vc.vibe_actor_tags void-all + replace)
- VEN-ONBOARDING-002 | HIGH | markActorOnboardingStepCompletedDAL — dead exported write surface, no callers, no ownership check; onboarding step forgery risk (vc.actor_onboarding_steps)
- VEN-ONBOARDING-003 | MEDIUM | profileId + vportId surfaced into controller layer via mapActorRow — architecture contract violation
- VEN-ONBOARDING-004 | LOW | Stale DEV PROBE console.log blocks with actorId in vibeInvites.dal.js and useOnboardingCards.js
- VEN-ONBOARDING-005 | MEDIUM | Production console.error in logOnboardingStepFailure emits actorId + raw Supabase error details with no DEV guard
- VEN-ONBOARDING-006 | MEDIUM | getOnboardingCardsController has no session verification — null check only on client-supplied actorId before 7 parallel DAL calls

Additional: MISSING_BEHAVIOR_CONTRACT — BEHAVIOR.md is a placeholder (no §5 Security Rules, no §9 Must Never Happen)

Output: ZZnotforproduction/APPS/VCSM/features/onboarding/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_onboarding-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

9 findings: 1 CRITICAL, 2 HIGH, 1 MEDIUM, 2 LOW, 3 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-ONBOARD-001 | HIGH | saveVibeTagsOnboardingController accepts actorId from parameter with no session re-verification; replaceSelectedVibeTagsDAL writes directly to vc.vibe_actor_tags for any supplied actorId | BYPASSED | OPEN |
| BW-ONBOARD-002 | CRITICAL | markActorOnboardingStepCompletedDAL is a dead exported write surface with no controller wrapper, no ownership check, no session verification; any importer can forge step completion for any actor | BYPASSED | OPEN |
| BW-ONBOARD-003 | MEDIUM | getOnboardingCardsController binds only to non-null actorId (null check only); any non-null actorId returns profile completion data for that actor; information disclosure on direct controller call | PARTIAL | OPEN |
| BW-ONBOARD-004 | HIGH | vc.vibe_actor_tags RLS status unverified; query-level filter exists but table-level RLS is unconfirmed; if absent, bulk writes for foreign actors possible at DB level | UNRESOLVED | OPEN |
| BW-ONBOARD-005 | LOW | completeOnboardingController uses upsert with no idempotency guard; replay overwrites profile fields including triggering username regeneration | PARTIAL | OPEN |
| BW-ONBOARD-006 | LOW | replaceSelectedVibeTagsDAL performs non-atomic void+upsert sequence; concurrent double-submit creates race window where tags are fully voided before re-insertion | PARTIAL | OPEN |
| BW-ONBOARD-007 | INFO | logOnboardingStepFailure emits actorId and raw Supabase error details to console.error with no DEV guard (adversarial confirmation of VEN-ONBOARDING-005) | BYPASSED | OPEN |
| BW-ONBOARD-008 | INFO | useOnboardingCards.js catch block emits actorId and full error stack to console.error with no DEV guard; production error logging with actor identity | BYPASSED | OPEN |
| BW-ONBOARD-009 | INFO | MISSING_BEHAVIOR_CONTRACT — BEHAVIOR.md is a PLACEHOLDER; all §9 invariants unanchored; 2 source-inferred invariants confirmed BYPASSED | N/A | OPEN |

Output: ZZnotforproduction/APPS/VCSM/features/onboarding/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_onboarding-adversarial-review.md
