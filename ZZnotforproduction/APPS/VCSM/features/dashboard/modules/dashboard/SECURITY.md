---
title: Dashboard Shell Module — Security
status: ACTIVE
feature: dashboard
module: dashboard (shell)
source: SOURCE_VERIFIED
owner: VENOM
last-run: 2026-06-05
ticket: TICKET-ARCHITECT-MODULE-0001
---

# Security Posture — dashboard / modules / dashboard (shell)

Last Updated: 2026-06-05
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-SHELL-002 (pending audit: 8 card sub-modules unverified; 5 sampled confirmed BLOCKED by BW)

---

## VENOM STATUS
VENOM Last Run: 2026-06-05
VENOM Status: COMPLETE

5 findings: 0 CRITICAL, 1 HIGH, 3 MEDIUM, 1 LOW

| Finding ID | Severity | THOR Blocker | Description |
|---|---|---|---|
| VEN-SHELL-001 | MEDIUM | NO | booking.adapter.js exports getActorByIdDAL — cross-domain trust boundary violation (ARCH-001 security dimension) |
| VEN-SHELL-002 | HIGH | YES | Shell isOwner gate is UI-only — card sub-modules must independently verify ownership; direct route bypass possible |
| VEN-SHELL-003 | MEDIUM | NO | Route ownership deferred to screen layer — async auth gap; public data only in loading window |
| VEN-SHELL-004 | LOW | NO | Self-access bypass in checkVportOwnershipController skips actor_owners — intentional, session-derived callerActorId, shell has no writes |
| VEN-SHELL-005 | MEDIUM | YES | Card catalog visibility is client-side model only — not a security control; card sub-modules must enforce their own access |

Full report: `outputs/2026/06/05/Venom/2026-06-05_venom_dashboard-shell.md`

Required follow-up: SPIDER-MAN (card route regression), ARCHITECT (card sub-module ownership audit), HAWKEYE (dashboard route auth contract), BLACKWIDOW (adversarial verify VEN-SHELL-002)

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-05
ELEKTRA Status: COMPLETE

0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 1 INFO | 4 False Positives Rejected

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-2026-06-05-001 | LOW | Open | QR/reviews-QR slug fallback navigates with raw actorId — public QR code may inherit UUID |
| ELEK-2026-06-05-002 | LOW | Open | booking.adapter exports getActorByIdDAL — boundary violation; migrate to @/shared/dal |
| ELEK-2026-06-05-INFO-001 | INFO | PATCHED | Prior ELEK-004 confirmed patched in assertActorOwnsVportActorController (kind-before-bypass) |

VENOM Cross-Reference:
- VEN-SHELL-001 (MEDIUM): ELEKTRA confirms 1 adapter-consumer — reclassification MEDIUM → LOW SUPPORTED
- VEN-SHELL-002 (HIGH): CONFIRMED HIGH — 8 card sub-modules unverified; THOR blocker stands
- VEN-SHELL-003 (MEDIUM): CONFIRMED — public data only in async window
- VEN-SHELL-004 (LOW): CONFIRMED — ELEK-004 historical patch verified in source
- VEN-SHELL-005 (MEDIUM): CONFIRMED — own-actor only; reclassification MEDIUM → LOW SUPPORTED

Out-of-Scope Referrals: createBooking.controller.js status allowlist gap + raw actorId in notification link — booking feature ELEKTRA run required (P1)

Output: outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_dashboard-shell.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-05
BLACKWIDOW Status: COMPLETE

0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW | 8 BLOCKED, 2 PARTIAL, 0 BYPASSED

| Finding ID | Severity | Result | Description |
|---|---|---|---|
| BW-DSH-SHELL-001 | LOW | PARTIAL | booking.adapter getActorByIdDAL — documented §5.3 exception, 1 call site confirmed; future consumers unguarded |
| BW-DSH-SHELL-002 | LOW | PARTIAL | Release flag bypass — VPORT type not validated at mutation layer; own-actor only (data integrity, not security) |

VENOM cross-reference:
- VEN-SHELL-001 (MEDIUM → LOW recommended): export is documented approved exception; SENTRY confirmation required before reclassification
- VEN-SHELL-002 (HIGH): 5 sampled card sub-modules confirmed BLOCKED (calendar, locksmith, exchange, bookings, gas); 8 cards unverified — THOR blocker stands
- VEN-SHELL-003 (MEDIUM): loading window IDOR confirmed BLOCKED — public data only
- VEN-SHELL-004 (LOW): void VPORT and user-kind actor bypass both confirmed BLOCKED
- VEN-SHELL-005 (MEDIUM → LOW recommended): own-actor only; SENTRY confirmation required

Full report: `outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_dashboard-shell.md`
