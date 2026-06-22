# Security Posture — invite

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-INVITE-001, BW-INVITE-002, BW-INVITE-004, BW-INVITE-005, BW-INVITE-006

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

Summary: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW

| Finding ID | Severity | Description |
|---|---|---|
| VEN-INVITE-001 | HIGH | `auth.admin.listUsers()` full O(n) scan on every invite — DoS amplification vector |
| VEN-INVITE-002 | HIGH | `invite_code` (one-time token) returned to sender's client in Edge Function response |
| VEN-INVITE-003 | MEDIUM | `rawDebugError` debug probe exported unconditionally from `useInvite()` public API |
| VEN-INVITE-004 | MEDIUM | No per-user rate limiting or invite deduplication — SES spam relay risk |
| VEN-INVITE-005 | HIGH | BEHAVIOR.md is a placeholder stub — no formal security rules or invariants authored |

Output: ZZnotforproduction/APPS/VCSM/features/invite/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_invite-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

Summary: 0 CRITICAL, 4 HIGH, 1 MEDIUM, 1 LOW, 0 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-INVITE-001 | MEDIUM | `readVibeInvitesDAL` returns `invite_code` tokens; RLS on `vc.vibe_invites` unverified — cross-actor token read may be possible | UNRESOLVED | OPEN |
| BW-INVITE-002 | HIGH | No deduplication or rate limit — authenticated user can replay N invite emails to same target (SES spam relay) | BYPASSED | OPEN |
| BW-INVITE-003 | LOW | Raw UUID in public-facing invite URL — may violate platform slug rule (policy ambiguity for token URLs) | PARTIAL | OPEN |
| BW-INVITE-004 | HIGH | Invite redemption token (`invite_code`) returned to sender client in Edge Function response and readable via `readVibeInvitesDAL` — sender can forward link to unintended recipients | BYPASSED | OPEN |
| BW-INVITE-005 | HIGH | Invite redemption entirely unimplemented — `invite_code` parsed from URL in `useRegister.js` but never validated server-side (TODO at useRegister.js:35) | BYPASSED | OPEN |
| BW-INVITE-006 | HIGH | `auth.admin.listUsers()` full O(n) user scan on every invite — adversarial DoS amplification confirmed (corroborates VEN-INVITE-001) | BYPASSED | OPEN |

Output: ZZnotforproduction/APPS/VCSM/features/invite/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_invite-adversarial-review.md
