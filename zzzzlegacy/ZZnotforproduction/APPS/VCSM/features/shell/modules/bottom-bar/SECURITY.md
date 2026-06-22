# SECURITY — bottom-bar

**Module:** `features/shell/modules/bottom-bar`
**Last Updated:** 2026-06-06 (THANOS run)

Full governance record:
- TOXIN: `outputs/2026/06/06/TOXIN/TOXIN_SECURITY_REPORT.md`
- THANOS: `outputs/2026/06/06/THANOS/THANOS_REPORT.md`

---

## Open Findings

| ID | Severity | THANOS Result | Description |
|---|---|---|---|
| TOXIN-BB-001 | MEDIUM | EXPLOIT_REACHABLE (conditional) | OneSignal _frozenSdk race window — XSS before first os() call → user.id exfil |
| TOXIN-BB-002 | LOW | EXPLOIT_BLOCKED (auth) / OPEN (info disclosure) | Raw actorId UUID in VportLeadsChip nav URL |
| TOXIN-BB-003 | LOW | EXPLOIT_BLOCKED | noti:refresh DOM event — no escalation beyond polling surge |
| TOXIN-BB-004 | LOW | EXPLOIT_BLOCKED | Race inert — profileIdRef never populated (see THANOS-BB-NEW-001) |
| TOXIN-BB-ARCH-001 | CRITICAL (arch) | FALSE_POSITIVE (security) | Profiles controller direct import — public SEO data, no auth escalation |
| TOXIN-BB-ARCH-002 | MEDIUM (arch) | FALSE_POSITIVE (security) | Dashboard controller direct import — gate at controller layer |
| THANOS-BB-NEW-001 | MEDIUM (functional) | NEW_FINDING_CREATED | callerActorId uses identity.actorId (vport) not identity.ownerActorId (user) → ownership gate always rejects → leads badge never shows |

## Closed Findings

| ID | Severity | Status | Closed By |
|---|---|---|---|
| VEN-BN-005 | LOW | CLOSED_SOURCE_VERIFIED | identity.adapter (2026-06-06) |

## THANOS Verdict

THANOS_CAUTION — 1 conditional exploit reachable, 1 new functional bug discovered
No active THOR blockers from THANOS run.

---

## TASKMASTER STATUS

**Last Run:** 2026-06-06
**Findings:** 0 HIGH | 2 MEDIUM | 1 LOW | 1 INFO
**False Positives Rejected:** 4
**Verdict:** CAUTION
**Full Report:** `outputs/2026/06/06/TASKMASTER/2026-06-06_taskmaster_bottom-bar.md`

| ID | Severity | Status | Description |
|---|---|---|---|
| TASK-2026-06-06-001 | MEDIUM | OPEN | `useVportLeadsCount.js:11` — callerActorId reads identity.actorId (vport-kind) instead of identity.ownerActorId (user-kind) → ownership gate always rejects → leads badge silently broken |
| TASK-2026-06-06-002 | MEDIUM | OPEN | `initOneSignal.js:31` / `onesignalClient.js:14` — _frozenSdk lazy-freeze race window → XSS can inject fake OneSignal before freeze → user.id exfil (XSS precondition required) |
| TASK-2026-06-06-003 | LOW | OPEN | `VportLeadsChip.jsx:15` — raw actorId UUID in leadsPath navigation URL → browser history / referrer disclosure |
| TASK-2026-06-06-004 | INFO | OPEN | 14 hooks across VCSM use identity.actorId as callerActorId — systemic pattern; requires per-module TASKMASTER follow-up |

**THOR Gate:** NO release blockers from this module (0 HIGH findings)
**Priority Patches:** TASK-2026-06-06-001 (P1 — one line fix), TASK-2026-06-06-002 (P1 — four lines post-init)
**Command Chain:** TOXIN → THANOS → TASKMASTER → PATCH → SPIDER-MAN → THOR

---

## THOR Gate

THOR Release Blocker: NO (current state — 0 HIGH findings)
Priority Patches: TASK-2026-06-06-001 (P1 — fix callerActorId field), TASK-2026-06-06-002 (P1 — freeze OneSignal ref)
Command Chain: TOXIN → THANOS → TASKMASTER → PATCH → SPIDER-MAN → THOR
