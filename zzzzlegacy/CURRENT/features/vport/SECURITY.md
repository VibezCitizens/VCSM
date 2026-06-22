# Security — vport
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

## Command Coverage

| Command | Status | Last Run | Scope |
|---|---|---|---|
| VENOM | RUN | 2026-05-10, 2026-05-14, 2026-05-22, 2026-05-27 | Full deep scan; locksmith; dashboard; QR/menu/settings; feed DAL; profiles |
| ELEKTRA | RUN | 2026-05-28 | Delete lifecycle; schedule card; exchange/profile |
| BLACKWIDOW | RUN | 2026-05-23 | VPORT dashboard; 2026-05-27 subscribers + content-pages + schedule/calendar |
| SENTRY | RUN | 2026-05-25, 2026-06-01 | Gas prices; barber/locksmith/barbershop architect gate |
| THOR | RUN | 2026-05-28 | Content-pages + delete lifecycle release gate — CAUTION |

---

## Write Surface Risk Assessment

- `vport/controller/` → CONFIG_WRITE | gate: YES | HIGH
- Auth gate: `assertActorOwnsVportActorController` — canonical shared ownership primitive, used at 9+ call sites
- Ownership chain: `actor_owners` → `vc.actors` (kind='vport') → `vport.profiles`
- Three write paths on the locksmith surface are MISSING this gate (S-BLK-001 — BEFORE RELEASE BLOCKER)

---

## Findings

### CRITICAL — OPEN

**VD-01** | CRITICAL | OPEN (as of 2026-05-10)
`removeTeamMemberController` — no actorId, no ownership check; any authenticated actor can remove any barber from any barbershop.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**VD-02** | CRITICAL | OPEN (as of 2026-05-10)
`acceptTeamRequestController` / `declineTeamRequestController` — no caller identity; any authenticated actor can accept or decline any team invite.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

---

### HIGH — OPEN

**VD-03** | HIGH | OPEN (as of 2026-05-10)
`updateBookingStatusController` — actorId is optional (defaults null); any authenticated actor can cancel/complete/no-show any booking.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**VD-04** | HIGH | OPEN (as of 2026-05-10)
`rescheduleBookingController` — no actorId; any actor can reschedule any booking.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**VD-05** | HIGH | OPEN (as of 2026-05-10)
`createOwnerBookingController` — no actor_owners check; any actor can inject source:"owner" bookings onto any VPORT.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**VD-06** | HIGH | OPEN (as of 2026-05-10)
`VportDashboardScreen` isOwner uses string equality (`identity.actorId === actorId`) — blocks all legitimate user-actor owners of VPORT-actors.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**VL-01** | HIGH | OPEN (as of 2026-05-10, RECONFIRMED 2026-06-01 by SENTRY S-BLK-001)
`ctrlUpdateServiceArea` — no actorId, no actor_owners check; cross-owner service area mutation possible.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_locksmith-vport.md`; `2026-06-01_sentry_barber-locksmith-barbershop-architect-gate.md`

**VL-02** | HIGH | OPEN (as of 2026-05-10, RECONFIRMED 2026-06-01 by SENTRY S-BLK-001)
`ctrlDeleteServiceArea` — no ownership check; cross-owner deletion possible.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_locksmith-vport.md`; `2026-06-01_sentry_barber-locksmith-barbershop-architect-gate.md`

**VL-03** | HIGH | OPEN (as of 2026-05-10, RECONFIRMED 2026-06-01 by SENTRY S-BLK-001)
`ctrlDeleteServiceDetail` — no guards at all; any authenticated actor can delete any locksmith's service details.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_locksmith-vport.md`; `2026-06-01_sentry_barber-locksmith-barbershop-architect-gate.md`

**ELEK-2026-05-28-007** | HIGH | OPEN
`deleteVportActorMenuCategoryController` — no `assertActorOwnsVportActorController`; actorId accepted from caller; RLS is sole gate. Menu category IDs reachable from public QR menu reads.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_delete-lifecycle.md`

**ELEK-2026-05-28-008** | HIGH | OPEN
`deleteVportActorMenuItemController` — same pattern as ELEK-007; menu item IDs are returned by public QR menu reads, enabling cross-actor delete.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_delete-lifecycle.md`

**ELEK-2026-05-28-009** | HIGH | OPEN
`deleteVportServiceAddonController` — no ownership check AND the DAL file does not exist (runtime broken on invocation).
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_delete-lifecycle.md`

**BW-VPD-010** | HIGH | RESOLVED (patched on branch)
`customerActorId` not validated against `requestActorId` in public booking flow — booking attribution injection.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-23_14-00_blackwidow_vport-dashboard.md`

**VENOM-CONTENT-001** | HIGH | OPEN (DB)
Hard delete with no soft-delete safety net; no `is_deleted`/`deleted_at` columns on `content_pages`.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_thor_content-pages-delete-lifecycle-security-gate.md`

**VEMON-CONTENT-004 / BW-CONTENT-004** | HIGH | OPEN (DB)
Former VPORT owners retain DB-level `content_pages` access via legacy RLS OR-merge; CARNAGE migration planned but not yet executed.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_thor_content-pages-delete-lifecycle-security-gate.md`

**VENOM-DELETE-002** | HIGH | OPEN
`soft_delete_vport`, `hard_delete_vport`, `restore_vport` RPCs not in tracked migrations — DR hazard for fresh deployments.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_thor_content-pages-delete-lifecycle-security-gate.md`

**VENOM-DELETE-003 / BW-DELETE-003** | HIGH | OPEN
Incomplete `hard_delete_vport` cascade — `vport.resources`, `portfolio_items`, `availability_exceptions`, `availability_rules`, `push_subscriptions` orphaned.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_thor_content-pages-delete-lifecycle-security-gate.md`

**S-BLK-001** | HIGH | OPEN (2026-06-01) — BEFORE RELEASE BLOCKER
`locksmithOwner.controller.js`: `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, `ctrlDeleteServiceDetail` — no session ownership assertion; Actor Ownership Contract violated. Reconfirmed by SENTRY.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-06-01_sentry_barber-locksmith-barbershop-architect-gate.md`

**BW-VPD-001** | HIGH | RESOLVED (VPD-V-020 patched on branch)
Raw UUID in notification `linkPath` from `cancelBooking` and `createVportPublicBooking` controllers.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-23_14-00_blackwidow_vport-dashboard.md`

**V-001** | HIGH | RESOLVED (patched 2026-05-27)
`readVportPublicDetailsRpcDAL` + `vportPublicDetails.model.js` — `profile_id` and raw geolocation (lat/lng) leaked to view layer via `raw:row`.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_01-03_venom_vport-menu-qr-module.md`

---

### MEDIUM — OPEN

**VD-07** | MEDIUM | OPEN (as of 2026-05-10)
`assertCallerOwns()` in `vportTeamAccess.controller.js` and `vportLeads.controller.js` uses string equality instead of `actor_owners` DB lookup.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**VD-08** | MEDIUM | OPEN (as of 2026-05-10)
`serviceLabelSnapshot` accepted from client and stored in `vport.bookings` — XSS vector in dashboard booking view.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**VD-09** | MEDIUM | OPEN (as of 2026-05-10)
`sendTeamRequestController` — no caller ownership check; any actor can send invites as any barbershop.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**VL-04** | MEDIUM | OPEN
`ctrlSavePortfolioDetail` — no ownership check on locksmith portfolio upsert.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_locksmith-vport.md`

**VL-05** | MEDIUM | OPEN
`locksmithServiceAreas.write.dal.js` UPDATE/DELETE filter only by `id`, no `actor_id` column check.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_locksmith-vport.md`

**VL-06** | MEDIUM | OPEN
`getLocksmithProfileController` — live pricing + verification field data scraping risk.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_locksmith-vport.md`

**VL-07** | MEDIUM | OPEN
`vportPublicDetails.read.dal` — `vport_id` and `is_deleted` exposed in public response.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_locksmith-vport.md`

**ELEK-2026-05-28-010** | MEDIUM | OPEN
`deleteVportContentPageDAL` — DELETE WHERE clause contains only `id`; no `actor_id` binding; TOCTOU window.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_delete-lifecycle.md`

**ELEK-2026-05-28-011** | MEDIUM | OPEN
`deleteVportActorMenuCategoryDAL` and `deleteVportActorMenuItemDAL` — actorId in WHERE clause is caller-supplied with no `auth.getUser()` session anchor.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_delete-lifecycle.md`

**ELEK-2026-05-28-065** | MEDIUM | OPEN
Mutation modals open during actor switch fire with new actor identity; stale modal context.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_schedule.md`

**ELEK-2026-05-28-066** | MEDIUM | OPEN
`VportDashboardScheduleScreen` has no screen-level ownership gate; controller is first and only layer.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_schedule.md`

**BW-VPD-002** | MEDIUM | OPEN
Booking state machine replay — terminal states (completed, cancelled, no_show) can be overwritten; no status guard in update/reschedule controllers.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-23_14-00_blackwidow_vport-dashboard.md`

**BW-VPD-005** | MEDIUM | OPEN
`notification.model.js` sender route falls back to `/profile/${actorId}` — UUID in rendered UI when no username.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-23_14-00_blackwidow_vport-dashboard.md`

**VENOM-SETTINGS-003** | MEDIUM | NEEDS_REVIEW
`syncDirectoryVisibleToPublicDetailsDAL` secondary gate uses legacy pattern — `auth.getUser()` + `owner_user_id = userId` instead of canonical `actor_owners`. Controller-level protection (`assertActorOwnsVportActorController`) and DB RLS are both canonical and intact. Non-blocking belt-and-suspenders finding.
Source: `zNOTFORPRODUCTION/HISTORY/2026/06/commands/wolverine/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md`

**V-002** | MEDIUM | RESOLVED (patched 2026-05-27)
`listQrLinks.controller.js` — `listQrLinksByProfile` and `listQrLinksByOrganization` had no app-layer caller auth.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_01-03_venom_vport-menu-qr-module.md`

**V-003** | MEDIUM | RESOLVED (patched 2026-05-27)
`useQrLinks.js` — identity surface violation; `profileId` and `organizationId` used as authority parameters instead of `actorId`.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_01-03_venom_vport-menu-qr-module.md`

**V-004** | MEDIUM | RESOLVED (patched 2026-05-27)
`VportActorMenuFlyerView.jsx` — UUID may be encoded in printed QR before `canonicalSlug` resolves.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_01-03_venom_vport-menu-qr-module.md`

**V-005** | MEDIUM | RESOLVED (patched 2026-05-27)
`VportActorMenuFlyerView.jsx` `onBack` navigates to `/vport/${actorId}` — UUID in public URL.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_01-03_venom_vport-menu-qr-module.md`

**BW-VPD-003** | MEDIUM | RESOLVED (VPD-V-016 patched)
`vportLeads` weak `assertCallerOwns` — string equality only; replaced with `assertActorOwnsVportActorController`.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-23_14-00_blackwidow_vport-dashboard.md`

---

### LOW — OPEN

**VD-10** | LOW | OPEN (as of 2026-05-10)
Cache not invalidated on VPORT deactivation/deletion; stale public details served for up to 60s.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom-robin_vport-dashboard.md`

**ELEK-2026-05-28-067** | LOW | OPEN
`ScheduleModals` status transitions not server-side validated against expected previous state.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_schedule.md`

---

### LOW — RESOLVED / ACCEPTED

**V-006** | LOW | RESOLVED (patched 2026-05-27)
UUID guard in `qrUrlBuilders` not at lib layer, only view layer.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_01-03_venom_vport-menu-qr-module.md`

**V-007** | LOW | ACCEPTED BY DESIGN (2026-05-27)
`resolveMenuSlugDAL` vs `resolveVportSlugDAL` — oracle disclosure reveals VPORT menu item existence. Accepted as by-design.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_01-03_venom_vport-menu-qr-module.md`

**V-008** | LOW | RESOLVED (patched 2026-05-27)
`VportActorMenuFlyerScreen` — flyer viewer was unauthenticated, now auth-gated to owner.
Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_01-03_venom_vport-menu-qr-module.md`

---

### DEFERRED

**VENOM-SETTINGS-004** | MEDIUM | DEFERRED (P2 CARNAGE)
`listMyVportsDAL` uses `owner_user_id` instead of canonical `actor_owners` two-hop join. Read-only; approved rewrite pattern documented in ARCHITECT audit.
Source: `zNOTFORPRODUCTION/_ACTIVE/audits/architecture/2026-05-27_architect_venom-settings-004-list-my-vports.md`

**ELEK-002** | MEDIUM | DEFERRED (separate security sprint)
`ctrlSetActorPrivacy` — any actor can be forced private.
Source: `zNOTFORPRODUCTION/HISTORY/2026/06/commands/wolverine/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md`

**ELEK-004** | MEDIUM | DEFERRED (separate security sprint)
`dalSetActorPrivacy` — no `auth.getUser()` session binding; DAL accepts any actorId without session check.
Source: `zNOTFORPRODUCTION/HISTORY/2026/06/commands/wolverine/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md`

---

### RESOLVED (full list)

| ID | Severity | Resolution |
|---|---|---|
| V-001 | HIGH | Raw field + geolocation leak patched 2026-05-27 |
| V-002 | MEDIUM | QR links controller auth gate added 2026-05-27 |
| V-003 | MEDIUM | useQrLinks refactored to actorId-only identity surface 2026-05-27 |
| V-004 | MEDIUM | Flyer UUID guard before slug resolves — patched 2026-05-27 |
| V-005 | MEDIUM | onBack UUID URL fixed 2026-05-27 |
| V-006 | LOW | UUID guard moved to lib layer 2026-05-27 |
| V-007 | LOW | Accepted by design 2026-05-27 |
| V-008 | LOW | Flyer auth-gated to owner 2026-05-27 |
| BW-VPD-001 | HIGH | Notification linkPath UUID fixed (VPD-V-020 patch on branch) |
| BW-VPD-003 | MEDIUM | vportLeads string equality → assertActorOwnsVportActorController (VPD-V-016) |
| BW-VPD-010 | HIGH | customerActorId validated against requestActorId (patched on branch) |
| VENOM-SETTINGS-001 | — | Controller export removed from settings index.js (TICKET-0009 2026-06-02) |
| VENOM-SETTINGS-002 | — | profile_public_details RLS canonicalized (CARNAGE migration 2026-05-27) |
| ELEK-001 | — | ctrlSetVportBusinessCardPublishState ownership gate confirmed present |
| ELEK-2026-05-28-064 | — | useVportOwnerSchedule.js callerActorId dep array fixed |
| Gas price SENTRY F-002 | — | publishFuelPriceUpdateAsPost.controller.js ownership gate added; ownership.adapter.js created 2026-05-25 |

---

## Summary Counts (as of 2026-06-02)

| Severity | Open | Resolved/Accepted | Deferred |
|---|---|---|---|
| CRITICAL | 2 | 0 | 0 |
| HIGH | 13 | 5 | 0 |
| MEDIUM | 12 | 5 | 3 |
| LOW | 2 | 3 | 0 |
| **Total** | **29** | **13** | **3** |

BEFORE RELEASE BLOCKER: S-BLK-001 (locksmith 3 write paths, HIGH)
THOR gate status: CAUTION — content-pages + delete lifecycle gate (2026-05-28); 4 HIGH items accepted as pre-existing pending CARNAGE migrations
