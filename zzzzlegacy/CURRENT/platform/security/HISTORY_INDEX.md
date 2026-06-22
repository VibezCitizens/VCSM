# Platform Security — Audit History Index

All source audit files read to produce this governance area.

---

## Audit Files

### 1. Whole-Project Deep Scan — 2026-05-09

| Field | Value |
|---|---|
| File | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-09_00-00_venom_whole-project-deep.md` |
| Date | 2026-05-09 |
| Command | VENOM |
| Scope | ALL APPS + ENGINE — first comprehensive cross-system pass |
| Trust boundary | Auth session → actor identity → ownership → DAL writes |
| Key findings | FINDING 1 (HIGH): Chat engine console.log leaks actorId + conversationId in production; FINDING 2 (HIGH): useInbox.js + openConversation.rpc.js leak PII (display names, usernames, actor_ids) to console; FINDING 3 (MEDIUM): profileId exposed in identity debug event payload |

---

### 2. VCSM Full Deep Scan — 2026-05-10

| Field | Value |
|---|---|
| File | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_00-00_venom_vcsm-full-deep-scan.md` |
| Date | 2026-05-10 |
| Command | VENOM |
| Scope | apps/VCSM — all features, full surface scan |
| Trust boundary | Auth session → actor identity → ownership gates → RLS |
| Findings count | 14 (F-01 through F-14): 1 CRITICAL, 4 HIGH, 6 MEDIUM, 2 LOW |
| Key open finding | F-02 HIGH: Moderation cross-domain privilege via `learning.platform_admins` — DB migration required |

---

### 3. VCSM Full Scan Remediation — 2026-05-10

| Field | Value |
|---|---|
| File | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_01-00_venom_vcsm-full-scan-remediation.md` |
| Date | 2026-05-10 |
| Command | VENOM (remediation report) |
| Scope | apps/VCSM only — patch output for 2026-05-10 deep scan |
| Source scan | `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` |
| Files changed | 20 (19 modified, 1 new) |
| DB migration included | Yes — SQL for F-02 (`moderation.moderators` table). Status: PENDING — not applied as of this report |

---

### 4. SECURITY DEFINER Trust Boundary Review — 2026-05-10 04:04

| Field | Value |
|---|---|
| File | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md` |
| Date | 2026-05-10 |
| Timestamp | 04:04 |
| Command | VENOM |
| Scope | VCSM + ENGINE — all SECURITY DEFINER functions across all schemas |
| Mode | Read-only — analysis only, no changes applied |
| Trigger | 140 SECURITY DEFINER functions identified — elevated privilege surface audit |
| Cross-reference | `_ACTIVE/audits/migrations/2026-05-10_04-04_carnage_secdefiner-rls-elimination.md` |
| CRITICAL findings | 3: admin_delete_user_everywhere (no auth guard); mark_all_messages_seen (uid param, no auth.uid()); get_unread_message_total (same pattern) |

---

### 5. SECURITY DEFINER Elimination Plan — 2026-05-10 04:04

| Field | Value |
|---|---|
| File | `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-10_04-04_carnage_secdefiner-rls-elimination.md` |
| Date | 2026-05-10 |
| Timestamp | 04:04 |
| Command | CARNAGE / DB / VENOM (joint review) |
| Scope | VCSM + ENGINE — all schemas: public, vc, chat, learning, wanders, platform |
| Mode | Read-only planning — no SQL executed, proposals only |
| Cross-reference | `CURRENT/features/dashboard/evidence/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md` |
| Total functions classified | 140 |
| Release blockers | 7 (see elimination plan Section 8) |
| Classification results | REMOVE: 13 / REPLACE WITH RLS: 10 / KEEP BUT HARDEN: 105 / CRITICAL FIX: 3 / UNKNOWN: 2 |
