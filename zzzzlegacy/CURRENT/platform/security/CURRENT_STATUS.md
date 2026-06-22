# Platform Security — Current Status

**As of:** 2026-05-10 (last audit date in source files)
**Coverage:** VCSM + ENGINE + all DB schemas

---

## Scan Coverage

| Layer | Coverage |
|---|---|
| apps/VCSM routes + controllers | Full — 2026-05-10 deep scan |
| engines/chat | Partial — console.log findings in 2026-05-09 scan; fix status UNKNOWN |
| engines/booking | UNKNOWN — not scanned independently |
| engines/identity | Partial — profileId event payload finding patched |
| engines/notifications | UNKNOWN — not scanned independently |
| DB / SECURITY DEFINER surface | 140 functions audited 2026-05-10 |
| apps/wentrex | UNKNOWN — not covered in available audit files |
| apps/Traffic | Noted as anon-only in 2026-05-09 scan; no dedicated VENOM pass found |

---

## Open Items

### CRITICAL

| ID | Finding | Location | Mitigation Status |
|---|---|---|---|
| secdefiner-F-01 | `admin_delete_user_everywhere` — no auth guard | `public` schema | OPEN — SQL proposed, not confirmed applied |
| secdefiner-F-02 | `mark_all_messages_seen` + `get_unread_message_total` — uid parameter, no auth.uid() check | `public` schema | OPEN — SQL proposed, not confirmed applied |

### HIGH — Deferred / Unconfirmed

| ID | Finding | Status |
|---|---|---|
| F-02 (vcsm-deep-scan) | Moderation cross-domain privilege via `learning.platform_admins` | OPEN — DB migration drafted, not applied |
| FINDING 1+2 (2026-05-09) | Chat engine console.log PII leaks (actorId, conversationId, inbox PII) | OPEN — engine fix not confirmed |
| F-10 (vcsm-deep-scan) | Wanders guest auth trust boundary gap | STATUS UNKNOWN — not in remediation output |

### MEDIUM — Unconfirmed

| ID | Finding | Status |
|---|---|---|
| F-13 (LOW) | useBlockActorAction — blockerActorId supplied by caller | STATUS UNKNOWN |
| F-14 (LOW) | appendIOSProdDebugLog — userId in ProtectedRoute | STATUS UNKNOWN |

### SECURITY DEFINER Elimination — Batch Status

| Batch | Action | Count | Status |
|---|---|---|---|
| Batch 1 | CRITICAL FIX (3) + REMOVE legacy (subset) | ~5 | OPEN — planned |
| Batch 2 | REPLACE WITH RLS — public schema SELECTs | subset of 10 | OPEN — planned |
| Batch 3 | REPLACE WITH RLS — vc schema writes | subset of 10 | OPEN — planned |
| Batch 4 | REMOVE remaining legacy stubs | subset of 13 | OPEN — planned |
| Batch 5 | KEEP BUT HARDEN — 105 functions | 105 | OPEN — planned |
| Pre-release | UNKNOWN functions — inspect and classify | 2 | OPEN — required before release |

**Release blockers:** 7 items per elimination plan Section 8 — details in source file.

---

## Patched in 2026-05-10 Remediation Run (Confirmed)

| Finding | File(s) Changed | Change Summary |
|---|---|---|
| F-01 CRITICAL | `assertModerationAccess.dal.js` + new controller | Authorization enforcement moved to controller layer |
| F-03 HIGH | `Blocks.controller.js` + `useBlockedCitizens.js` | `callerActorId` assertion added |
| F-04 HIGH | `appRoutes.redirects.jsx` + `app.routes.jsx` | `OwnerOnlyDashboardGuard` added |
| F-05 HIGH | `vportTeamAccess.controller.js` + `vportLeads.controller.js` + hooks | `assertCallerOwns` + session binding |
| F-06 HIGH | `joinBarbershopAccount.controller.js` + `joinInvite.dal.js` | Ownership gate before accept; profile_id removed |
| F-07 MEDIUM | `identity.controller.js` | `profileId` removed from debug event payload |
| F-08 MEDIUM | `getDebugPrivacyRows.controller.js` | isOwner comparison corrected |
| F-09 MEDIUM | `DebugPrivacyPanel.jsx` | Removed profile_id and vport_id columns |
| F-11 MEDIUM | 3 files | `console.error` calls gated with `import.meta.env.DEV` |
| F-12 MEDIUM | `joinInvite.dal.js` | `profile_id` removed from RESOURCE_COLS |

Total: 20 files changed (19 modified, 1 new) in 2026-05-10 remediation run.
