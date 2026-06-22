---
# dashboard — DEFERRED.md
# Last Updated: 2026-06-04
# Ticket: TICKET-DASH-BLACKWIDOW-DOC-SYNC-001
# Status: CURRENT SOURCE OF TRUTH

All deferred items for the dashboard feature. Linked to REGISTRY/DEFERRED_ITEMS.md when that registry is built.

## Open Deferred Items

### DEFER-DASH-001 — Schedule hook split
- **Priority:** P1
- **Status:** OPEN
- **Module:** schedule card
- **Finding:** useVportOwnerSchedule.js is overloaded — mixes data fetching, modal state, and booking operations
- **Resolution:** Split into useScheduleData.js / useScheduleModals.js / useScheduleBookingOps.js
- **Blocked by:** None — safe to implement
- **Deferred from:** TICKET-0004 (coordinator fix was P0; split carries refactor risk)
- **Recommended ticket:** Open now — SETTINGS-ARCH-001 is complete (TICKET-0009); hook split is safe to begin

### DEFER-DASH-004 — VENOM-SETTINGS-003: Legacy `owner_user_id` in settings write DALs
- **Priority:** P2
- **Status:** OPEN / LOW
- **Module:** settings card — `settings/vports/dal/vports.write.dal.js` + `settings/dal/vportPublicDetails.write.dal.js`
- **Finding:** Three write DALs use `auth.getUser()` + `owner_user_id = userId` as secondary ownership check — legacy pattern, not canonical `actor_owners`
- **Why deferred:** Not exploitable — canonical controller gate precedes all three; DB RLS is final backstop. Belt-and-suspenders upgrade only.
- **Resolution:** CARNAGE migration — replace `owner_user_id` check with `actor_owners` query
- **Reference:** TICKET-DASH-VENOM-001
- **Sprint target:** CARNAGE Migration Sprint

### DEFER-DASH-006 — BW-SETTINGS-002: flyerBuilder writes to profile_public_details with no controller ownership gate
- **Priority:** P2
- **Status:** OPEN / MEDIUM
- **Module:** flyerBuilder — `dashboard/flyerBuilder/controller/flyerEditor.controller.js` + `dashboard/flyerBuilder/dal/flyer.write.dal.js`
- **Finding:** `saveFlyerPublicDetailsCtrl` calls `saveFlyerPublicDetails` DAL directly with no ownership gate. Writes to `vport.profile_public_details` with overlapping columns (`website_url`, `phone_public`, `hours`) that the settings card also manages. DB RLS is sole protection.
- **Why deferred:** DB RLS confirmed canonical for profile_public_details. Not exploitable by unauthorized users. Weaker posture than settings path. Requires flyer builder VENOM/BLACKWIDOW pass.
- **Resolution:** Add `assertActorOwnsVportActorController` to `saveFlyerPublicDetailsCtrl`, or refactor flyer builder save to use the settings coordinator path
- **Reference:** TICKET-DASH-BLACKWIDOW-001 (BW-SETTINGS-002)
- **Sprint target:** TICKET-FLYER-VENOM-001

### DEFER-DASH-008 — BW-SETTINGS-001: useSaveVportSettings missing saving guard
- **Priority:** P3
- **Status:** OPEN / INFO
- **Module:** settings card — `settings/hooks/useSaveVportSettings.js`
- **Finding:** `onSave` callback has no `if (saving) return;` guard at the top. Double-tap can fire two concurrent controller calls. No security impact — both calls pass ownership; PostgreSQL UPSERT serializes at row lock level; result is idempotent.
- **Why deferred:** UX concern only. Not a blocker. No data corruption, no auth bypass.
- **Resolution:** Add `if (saving) return;` as first guard inside `onSave` callback
- **Reference:** TICKET-DASH-BLACKWIDOW-001 (BW-SETTINGS-001)
- **Sprint target:** Next WOLVERINE cleanup pass or SPIDER-MAN regression

### DEFER-DASH-009 — BW-SETTINGS-004: legacy owner_user_id in read DALs (settings/vports)
- **Priority:** P3
- **Status:** OPEN / INFO
- **Module:** settings/vports — `settings/vports/dal/vports.read.dal.js` (readVportBusinessCardSettingsDAL, readVportDirectoryStateDAL)
- **Finding:** Two read DALs use `auth.getUser()` + `owner_user_id` secondary check. Read-only operations. Controller gates upstream confirm callerActorId before DAL fires. No exploitable path.
- **Why deferred:** Read-only; controller-gated; non-exploitable. Secondary ownership pattern, not a write vulnerability. Belt-and-suspenders concern only.
- **Resolution:** CARNAGE migration — align read DAL ownership to `actor_owners` pattern (same sprint as DEFER-DASH-004)
- **Reference:** TICKET-DASH-BLACKWIDOW-001 (BW-SETTINGS-004)
- **Sprint target:** CARNAGE Migration Sprint (same as DEFER-DASH-004)

## Resolved Deferred Items

### DEFER-010 / DEFER-011 — Portfolio nested hook placement — RESOLVED 2026-06-04
- `cards/portfolio/components/portfolio/hooks/usePortfolioItemSubmit.js` and `usePortfolioMediaUpload.js` were moved to `cards/portfolio/hooks/`.
- `PortfolioItemForm.jsx` now imports both hooks from the card-level hooks boundary.
- Verified by `portfolio.spiderman.test.js`.
- Ticket: TICKET-DASH-PORTFOLIO-COMPLETE-001

### DEFER-DASH-005 — VENOM-SETTINGS-005: vportBusinessCardSettings.controller.js direct booking controller import — RESOLVED 2026-06-04
- `settings/vports/controller/vportBusinessCardSettings.controller.js` now imports `assertActorOwnsVportActorController` from `@/features/booking/adapters/booking.adapter`.
- Additional source cleanup: `settings/vports/controller/vportSocialSettings.controller.js` was aligned to the same adapter boundary.
- Verified: source scan shows no settings controller imports the internal booking controller path.

### DEFER-DASH-007 — BW-SETTINGS-003: orphaned write DAL in settings/profile/dal/ — RESOLVED 2026-06-04
- Deleted `settings/profile/dal/vportPublicDetails.write.dal.js`.
- Removed the dev diagnostics upsert probe that imported and executed the dead DAL.
- Verified: source scan shows no remaining imports of `upsertVportPublicDetails` or the deleted file.

### DEFER-DASH-002 — Settings coordinator (SETTINGS-ARCH-001) — RESOLVED TICKET-0009 (2026-06-02)
- settingsCoordinator.controller.js created; useSaveVportSettings refactored; DAL/controller removed from index
- Verified: SENTRY PARTIAL (TICKET-DASH-SENTRY-001); VENOM PASS (TICKET-DASH-VENOM-001)

### DEFER-DASH-003 — ctrlSetVportBusinessCardPublishState ownership gate — RESOLVED TICKET-0009 pre-flight
- assertActorOwnsVportActorController confirmed on line 7 of vportBusinessCard.controller.js
- Verified: SENTRY source read; VENOM source read

### DEFER-013 — Schedule cross-card booking controller import
- **Priority:** P0
- **Status:** RESOLVED 2026-06-02
- **Module:** schedule card
- **Finding:** schedule hook imported bookings internal controllers directly (2 violation imports)
- **Resolution:** scheduleBookingCoordinator.controller.js created as boundary layer
- **Verification:** grep cards/bookings/controller in schedule = 0 matches; 3 delegation tests passing
- **Ticket:** TICKET-0004
- **Evidence:** HISTORY/2026/06/commands/wolverine/2026-06-02_wolverine_dashboard-ticket-0004.md
---
