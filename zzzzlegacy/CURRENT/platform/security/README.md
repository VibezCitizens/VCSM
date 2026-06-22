# Platform: Security Governance

**Scope:** Platform-wide security audits — not feature-specific
**Last full-scan date:** 2026-05-10
**Scan coverage:** VCSM + ENGINE + all schemas (public, vc, chat, learning, wanders, platform)

## What This Area Covers

Platform-wide VENOM sweeps, secdefiner trust boundary audits, and cross-feature security
remediation tracking. Covers findings across the auth session → actor identity → ownership →
DAL write trust boundary.

## Audit Chain Summary

| Date | Command | Scope | Report |
|---|---|---|---|
| 2026-05-09 | VENOM | ALL APPS + ENGINE — first comprehensive cross-system pass | `CURRENT/features/dashboard/evidence/2026-05-09_00-00_venom_whole-project-deep.md` |
| 2026-05-10 | VENOM | apps/VCSM — full deep surface scan | `CURRENT/features/dashboard/evidence/2026-05-10_00-00_venom_vcsm-full-deep-scan.md` |
| 2026-05-10 | VENOM (remediation) | apps/VCSM — patch report for full deep scan | `CURRENT/features/dashboard/evidence/2026-05-10_01-00_venom_vcsm-full-scan-remediation.md` |
| 2026-05-10 04:04 | VENOM | VCSM + ENGINE — SECURITY DEFINER trust boundary review | `CURRENT/features/dashboard/evidence/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md` |
| 2026-05-10 04:04 | CARNAGE / DB / VENOM | VCSM + ENGINE — SECURITY DEFINER elimination plan | `_ACTIVE/audits/migrations/2026-05-10_04-04_carnage_secdefiner-rls-elimination.md` |

## Open Platform-Wide Findings

### OPEN — F-02 (VCSM deep scan): Cross-domain privilege escalation — moderation depends on learning.platform_admins

DB migration required to decouple `moderation.moderators` from `learning.platform_admins`.
SQL drafted and included in remediation report. Migration not yet applied as of last audit.
Until migration runs, `isModerationAuthorizedDAL` still reads `learning.platform_admins`.

### OPEN — secdefiner-F-01: admin_delete_user_everywhere — CRITICAL, no authorization guard

`public.admin_delete_user_everywhere(p_user_id uuid)` has no `auth.uid()` check, no role
check, and no admin gate. Any authenticated caller can invoke it to permanently delete any
user's data. Classified CRITICAL in CARNAGE elimination plan. Status as of 2026-05-10:
EXECUTE revoke and admin guard proposed — not confirmed applied.

### OPEN — secdefiner-F-02: mark_all_messages_seen — takes uid as parameter, no auth check

`public.mark_all_messages_seen(uid uuid)` and `public.get_unread_message_total(uid uuid)`
accept uid as a caller-supplied parameter with no `auth.uid()` binding. Classified CRITICAL
in elimination plan. Mitigation proposed — not confirmed applied.

### OPEN — secdefiner elimination batches: 140 SECURITY DEFINER functions classified

| Classification | Count | Status |
|---|---:|---|
| REMOVE — legacy/stub/wrapper | 13 | PENDING (Batches 1 + 4) |
| REPLACE WITH RLS | 10 | PENDING (Batches 2 + 3) |
| KEEP BUT HARDEN | 105 | PENDING (Batch 5) |
| CRITICAL FIX REQUIRED | 3 | PENDING — see above |
| UNKNOWN — body not inspected | 2 | PENDING — pre-release verification |

Release blockers: 7 items per elimination plan Section 8 (details in source file).

### OPEN — secdefiner: public.handle_post_reaction — UNKNOWN, body not inspected

Classified UNKNOWN in elimination plan. Treat as HIGH risk until verified.

## Remediated Findings (2026-05-10 patch run)

The following findings from `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` were patched
in the remediation pass (20 files changed, 19 modified + 1 new):

- F-01 (CRITICAL): Authorization logic in DAL — `assertModerationAccess.dal.js` refactored,
  enforcement moved to controller layer.
- F-03 (HIGH): Settings block controller — added `callerActorId` assertion.
- F-04 (HIGH): Dashboard route guard — `OwnerOnlyDashboardGuard` added.
- F-05 (HIGH): Dashboard controllers — `assertCallerOwns` + `callerActorId` added.
- F-06 (HIGH): Invite acceptance — ownership verification before accept.
- F-07 (MEDIUM): `profileId` removed from identity debug event payload.
- F-08 (MEDIUM): `getDebugPrivacyRows` isOwner comparison fixed (type mismatch).
- F-09 (MEDIUM): `DebugPrivacyPanel` — `profile_id` and `vport_id` columns removed.
- F-11 (MEDIUM): Multiple unguarded console.error/warn — all gated with `import.meta.env.DEV`.
- F-12 (MEDIUM): `joinInvite.dal.js` — `profile_id` removed from `RESOURCE_COLS`.
- FINDING 1 + 2 (2026-05-09 scan): Chat engine console.log PII leaks — DEV gate required
  (status of engine-layer fix: UNKNOWN — not listed in VCSM remediation report).

**Note:** F-10 (Wanders guest auth context trust boundary gap) and F-13/F-14 (LOW severity)
are not listed in remediation output — status UNKNOWN.
