# Security Posture — state

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-STATE-004, VEN-STATE-007, BW-STATE-001, BW-STATE-002

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

0 CRITICAL, 3 HIGH, 4 MEDIUM, 2 LOW

- VEN-STATE-001 | HIGH   | PII fields (email, birthdate, age, sex, is_adult) in mapProfileActor and accessible via deprecated identity context
- VEN-STATE-002 | MEDIUM | Deprecated hooks (useIdentityDetailsDeprecated, useIdentityDisplayDeprecated) expose full identityDetails with lifecycle state; no sunset timeline
- VEN-STATE-003 | MEDIUM | findSelfHealActorForUser uses userId as profileId in actor lookup — violates actor_owners-as-authority contract
- VEN-STATE-004 | HIGH   | BEHAVIOR.md is PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants for the app's most critical security module
- VEN-STATE-005 | LOW    | IdentityDebugger.jsx renders JSON.stringify(identity) in dev panel; correctly DEV-gated but lives in wrong layer
- VEN-STATE-006 | LOW    | assertActorId emits console.error with actor value without IS_DEV gate — production log exposure
- VEN-STATE-007 | HIGH   | Blocked VPORT auto-switch is a silent no-op when no user-kind actor exists — blocked VPORT identity persists as active
- VEN-STATE-008 | MEDIUM | readVportIdentityDAL fetches owner_user_id (auth UID) unnecessarily — data minimization violation
- VEN-STATE-009 | MEDIUM | identityEngineQuery staleTime: 120_000 on security-sensitive availableActors list — 2-minute window for stale actor access

Output: ZZnotforproduction/APPS/VCSM/features/state/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_state-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

0 CRITICAL, 2 HIGH, 1 MEDIUM, 1 LOW, 1 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-STATE-001 | HIGH | Identity state module absent from security path scanner — zero scanner coverage for most critical platform module | UNRESOLVED | DRAFT |
| BW-STATE-002 | HIGH | BEHAVIOR.md is PLACEHOLDER — §9 invariants unanchored for platform's most critical security module | UNRESOLVED | DRAFT |
| BW-STATE-003 | MEDIUM | `isSwitchable` not enforced at app layer in `switchActorController` — engine enforces but no typed app-layer error | PARTIAL | DRAFT |
| BW-STATE-004 | LOW | `switchActor` has no explicit null-user guard — safe in practice because ctx abort fires first | BLOCKED | DRAFT |
| BW-STATE-005 | INFO | Blocked VPORT auto-switch silently no-ops when no user-kind actor exists — route redirect to /vport/restore compensates (VEN-STATE-007 confirmed) | PARTIAL | DRAFT |

Output: ZZnotforproduction/APPS/VCSM/features/state/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_state-adversarial-review.md
