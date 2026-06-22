# TICKET-DASH-VENOM-DOC-SYNC-001 — Dashboard Settings VENOM Results Governance Sync

**Date:** 2026-06-02
**Command:** WOLVERINE
**Ticket:** TICKET-DASH-VENOM-DOC-SYNC-001
**Category:** dashboard-settings
**Type:** TASK — documentation sync
**App:** VCSM
**Feature:** dashboard / settings card
**Scope:** CURRENT governance docs only — no source code modified

---

## 1. Source of Truth

**TICKET-DASH-VENOM-001 verdict:** PASS WITH DEFERRED ITEMS

Settings card trust boundaries confirmed secure via full post-implementation VENOM pass.
18 source files read and verified. 10 attack paths tested — all blocked.

### Confirmed Secure

- Every write path passes `assertActorOwnsVportActorController` before DB mutation
- Triple gate on `profile_public_details` writes (controller + DAL legacy + DB RLS)
- Double gate on directory visibility and business card settings writes
- SECURITY DEFINER RPC on business card publish state (strongest possible pattern)
- `settings/index.js` exposes no DALs or controllers
- `useSaveVportSettings` does not own business validation — delegates entirely to coordinator
- Kind check precedes self-shortcut in assertActorOwnsVportActorController (ELEK-004 fix confirmed)
- Null guards on all parameters throughout chain

### Findings

| ID | Severity | Status | Resolution |
|---|---|---|---|
| VENOM-SETTINGS-001 | — | RESOLVED | Controller removed from public index (TICKET-0009) |
| VENOM-SETTINGS-002 | — | RESOLVED | RLS canonicalized (CARNAGE 2026-05-27) |
| VENOM-SETTINGS-003 | LOW | OPEN | Legacy `owner_user_id` secondary check in 3 write DALs — non-exploitable, CARNAGE target |
| VENOM-SETTINGS-004 | — | RESOLVED IN SOURCE | `listMyVportsDAL` uses canonical `actor_owners`; prior governance claim was stale |
| VENOM-SETTINGS-005 | INFO | OPEN | Direct booking controller import in `vportBusinessCardSettings.controller.js`; no runtime impact |

---

## 2. Files Updated

| File | Changes |
|---|---|
| `CURRENT/features/dashboard/SECURITY.md` | Header; intro text; Posture Summary (VENOM COMPLETE, severity LOW, BLACKWIDOW NOT RUN); VENOM-SETTINGS-004 moved to RESOLVED; VENOM-SETTINGS-003 renamed NEEDS_REVIEW → OPEN confirmed LOW; VENOM-SETTINGS-005 added INFO; DEFERRED section cleared; Audit Coverage table added; History Index 2 rows added |
| `CURRENT/features/dashboard/CURRENT_STATUS.md` | Header; Active Ticket State (VENOM-001 RESOLVED, VENOM-DOC-SYNC-001 RESOLVED, BLACKWIDOW-001 RECOMMENDED NEXT); Release Gate State (settings VENOM PASS); Last Command Runs 2 rows; TICKET-0009 VENOM line updated; TICKET-DASH-VENOM-001 section added; DR.STRANGE Summary updated |
| `CURRENT/features/dashboard/DEFERRED.md` | Header; DEFER-DASH-001 trigger updated; DEFER-DASH-002 + DEFER-DASH-003 marked RESOLVED; DEFER-DASH-004 (VENOM-SETTINGS-003) added P2; DEFER-DASH-005 (VENOM-SETTINGS-005) added P3; resolved section updated |
| `CURRENT/features/dashboard/TESTS.md` | Header; Full regression suite trigger updated (VENOM unblocked); SPIDER-MAN status updated |
| `CURRENT/features/dashboard/HISTORY_INDEX.md` | Header; HISTORY Artifacts 2 new rows (VENOM-001, VENOM-DOC-SYNC-001); CURRENT Files backing table updated; Expected Future Entries (VENOM removed, BLACKWIDOW promoted to NEXT) |

---

## 3. Findings Moved to Resolved

| Finding | Prior Status | New Status | Evidence |
|---|---|---|---|
| VENOM-SETTINGS-004 — listMyVportsDAL legacy `owner_user_id` | DEFERRED P2 (governance claim stale) | RESOLVED IN SOURCE | `vports.read.dal.js` lines 22–52; comment: "owner_user_id is not used — §1.4 Owner Meaning Rule"; TICKET-DASH-VENOM-001 source read |
| DEFER-DASH-002 — Settings coordinator | RECOMMENDED / not ticketed | RESOLVED | TICKET-0009; verified SENTRY + VENOM |
| DEFER-DASH-003 — ctrlSetVportBusinessCardPublishState gate | RECOMMENDED / not ticketed | RESOLVED | TICKET-0009 pre-flight; SENTRY + VENOM source reads |

---

## 4. Findings Remaining Open

| Finding | Severity | Sprint |
|---|---|---|
| VENOM-SETTINGS-003 — legacy `owner_user_id` secondary check in 3 write DALs | LOW | CARNAGE Migration Sprint |
| DEFER-DASH-001 — useVportOwnerSchedule.js hook split | P1 | Open now — safe to begin |
| bookings/index.js Rule 9 — write DAL on public index | P1 | TICKET-DASH-BOOKINGS-RULE9 |

---

## 5. New Info Finding Documented

**VENOM-SETTINGS-005 — INFO**
`settings/vports/controller/vportBusinessCardSettings.controller.js` imports `assertActorOwnsVportActorController` directly from `@/features/booking/controller/assertActorOwnsVportActor.controller` instead of `@/features/booking/adapters/booking.adapter`.

Sibling controllers `vportBusinessCard.controller.js` and `vportDirectoryVisibility.controller.js` both use the canonical adapter import path.

- Runtime security impact: NONE
- Architecture impact: LOW — inconsistency, hidden coupling to booking internals
- Resolution: one-line import alignment in WOLVERINE cleanup pass
- THOR blocker: NO

---

## 6. Remaining Commands

| Priority | Ticket | Command | Description |
|---|---|---|---|
| P1 NEXT | TICKET-DASH-BLACKWIDOW-001 | /BLACKWIDOW | Settings adversarial pass — runtime simulation of bypass chains not visible in static analysis |
| P1 PARALLEL | TICKET-DASH-BOOKINGS-RULE9 | /WOLVERINE | Remove insertVportBooking.write.dal export from bookings/index.js |
| P0 DB-BLOCKED | TICKET-BOOKING-RPC-001 | — | Waiting on DB team |
| P2 | — | /SPIDER-MAN | Settings card + coordinator test coverage (VENOM unblocked this) |
| P2 | — | /IRONMAN | Ownership audit |
| P2 | — | /KRAVEN | Performance audit |

---

## 7. Confirmation

- No app source code modified ✓
- No engine files modified ✓
- No files moved, deleted, or renamed ✓
- No git commands run ✓
- All edits within `CURRENT/features/dashboard/` or `CURRENT/outputs/` ✓
- 5 governance files updated ✓
- Output report created ✓
- INDEX.md updated ✓
