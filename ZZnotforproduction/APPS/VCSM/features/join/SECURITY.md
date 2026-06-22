# Security Posture — join

Last Updated: 2026-06-04
Highest Open Severity: MEDIUM
THOR Release Blocker: NO

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

3 MEDIUM, 1 LOW — 0 CRITICAL, 0 HIGH

- VEN-JOIN-001 — MEDIUM — Pre-auth token validity oracle via unauthenticated resource fetch
- VEN-JOIN-002 — MEDIUM — autoResumeInviteOnboarding creates side-effects before verifying invite resource state
- VEN-JOIN-003 — MEDIUM — Client-controlled metadata embedded in auth JWT without server-side length/character validation
- VEN-JOIN-004 — LOW — BEHAVIOR.md is a placeholder; no security contract defined

Output: ZZnotforproduction/APPS/VCSM/features/join/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_join-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

0 CRITICAL, 0 HIGH, 3 MEDIUM, 1 LOW, 0 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-JOIN-001 | MEDIUM | acceptJoinResourceDAL UPDATE has no caller-identity ownership filter in SQL; ownership enforced only at controller layer; RLS on vport.resources unverified | PARTIAL | DRAFT |
| BW-JOIN-002 | LOW | autoResumeInviteOnboarding uses optional chaining on injected DAL dependency; correct behavior but structurally duck-typed rather than type-safe | PARTIAL | DRAFT |
| BW-JOIN-003 | MEDIUM | Invite-path controllers (createBarberVportAndAccept, useExistingBarberVportAndAccept, autoResumeInviteOnboarding) lack controller-layer resource state pre-check before calling acceptJoinResourceDAL; only QR path has ELEK-001 defense-in-depth | PARTIAL | DRAFT |
| BW-JOIN-004 | MEDIUM | Raw resource UUID exposed in public-facing URL (/join/barbershop/{uuid}) and email redirect; violates platform no-raw-IDs-in-URLs policy | BYPASSED | DRAFT |

Output: ZZnotforproduction/APPS/VCSM/features/join/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_join-adversarial-review.md
