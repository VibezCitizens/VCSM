# Current Status — vport
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

| Field | Value |
|---|---|
| Status | ACTIVE — multiple open security findings; release gates not fully cleared |
| Security Tier | HIGH |
| Auth Surface | OWNER |
| Priority | P0 |
| Last Security Audit | 2026-06-01 (SENTRY barber/locksmith/barbershop gate) |
| Last VENOM Run | 2026-05-27 (QR/menu/settings surface) |
| Last ELEKTRA Run | 2026-05-28 (delete lifecycle + schedule) |
| Last BLACKWIDOW Run | 2026-05-23 (vport dashboard) |
| Open Security Findings | 27 OPEN (across all VPORT sub-surfaces) |
| Open Tickets | TICKET-BOOKING-RPC-001, TICKET-PLATFORM-RLS-001, TICKET-FEED-CARDS-002 |
| Recommended Next Command | ARCHITECT (OWNER surface + full boundary mapping) |
| Last Updated | 2026-06-02 |

---

## Ticket State

| Ticket | Title | Status | Priority |
|---|---|---|---|
| TICKET-0004 | Dashboard Architecture Contract + Schedule P0 | COMPLETE | P0 |
| TICKET-0005 | bookings_select_actor_owner RLS verification | CLOSED | P0 |
| TICKET-0009 | SETTINGS-ARCH-001 + SETTINGS-RISK-001 + dashboard security backfill | COMPLETE | P1 |
| TICKET-BOOKING-RPC-001 | Replace broad booking INSERT/UPDATE with typed state-machine RPCs | OPEN / DB-BLOCKED | P0 |
| TICKET-PLATFORM-RLS-001 | platform.media_assets {public} policy cleanup | OPEN | P1 |
| TICKET-FEED-CARDS-002 | Add payload.vportKind discriminator for barbershop_portfolio_update | OPEN | LOW |

---

## Known Blockers

### S-BLK-001 — Locksmith controller ownership gates missing (BEFORE RELEASE BLOCKER)
- `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, `ctrlDeleteServiceDetail` in `locksmithOwner.controller.js`
- No `assertActorOwnsVportActorController` call on any of the 3 write paths
- Reconfirmed 2026-06-01 by SENTRY
- Status: HIGH — BEFORE RELEASE BLOCKER

### ELEK-2026-05-28-007 / ELEK-2026-05-28-008 — Menu delete controllers missing ownership gate
- `deleteVportActorMenuCategoryController` and `deleteVportActorMenuItemController` have no `assertActorOwnsVportActorController`
- Menu item IDs are returned by public QR menu reads — cross-actor delete is reachable
- Status: HIGH — separate sprint + separate THOR gate required

### ELEK-2026-05-28-009 — deleteVportServiceAddonController missing gate AND DAL does not exist
- Missing ownership check AND the DAL file referenced does not exist (runtime broken)
- Status: HIGH — dual failure

### BW-VPD-002 — Booking state machine replay
- Terminal states (completed, cancelled, no_show) can be overwritten
- No status guard in update/reschedule controllers
- Status: MEDIUM — OPEN

### V-SUB-001/002/003 — Subscribers ownership gate regression tests failing
- 17 tests intentionally FAILING in CI for `ctrlSubscribe`, `ctrlUnsubscribe`, `ctrlListIncomingRequests`
- Will go green when ownership gates are added to those controllers
- Status: OPEN — CI blocked

### VENOM-CONTENT-004 / BW-CONTENT-004 — Legacy content_pages RLS (DB-BLOCKED)
- Former VPORT owners retain DB-level content_pages access via legacy RLS OR-merge
- CARNAGE migration planned but not yet executed
- Status: HIGH — DB-BLOCKED

### VENOM-DELETE-002 — Delete RPCs not in tracked migrations
- `soft_delete_vport`, `hard_delete_vport`, `restore_vport` RPCs are not in tracked migrations
- DR hazard for fresh deployments
- Status: HIGH — OPEN

### VENOM-DELETE-003 — Incomplete hard_delete_vport cascade
- 5 tables orphaned on hard delete: `vport.resources`, `portfolio_items`, `availability_exceptions`, `availability_rules`, `push_subscriptions`
- Status: HIGH — OPEN

### Hardcoded PUBLIC_REALM_ID in system post controllers
- Gas price + menu system post controllers use hardcoded PUBLIC_REALM_ID `"2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2"`
- HIGH risk when Void Realm launches — must be replaced with `resolvePublicRealmIdDAL()`
- Status: HIGH — OPEN (pre-existing before Void Realm feature work begins)

### TICKET-BOOKING-RPC-001 — DB-BLOCKED
- Replace broad booking INSERT/UPDATE with typed state-machine RPCs
- `customer_actor_id` injection + status overpermission confirmed on live DB
- Blocked by: database-level change required before code change is safe

---

## Recommended Next Action

1. Resolve S-BLK-001 — add `assertActorOwnsVportActorController` to the 3 locksmith write paths (BEFORE RELEASE)
2. Resolve ELEK-007/008 — add ownership gate to menu delete controllers (separate sprint)
3. Resolve ELEK-009 — create missing DAL + add ownership gate to deleteVportServiceAddonController
4. Run CARNAGE — content-pages legacy RLS migration (VENOM-CONTENT-004) + delete cascade (VENOM-DELETE-003)
5. Run SPIDER-MAN — CRITICAL regression coverage for `assertActorOwnsVportActor`, `vportLeads`, `createBooking`, `cancelBooking`, `listQrLinks`, `qrUrlBuilders`
6. Fix subscriber ownership gates to unblock 17 failing CI tests (V-SUB-001/002/003)

---

## DR. STRANGE Summary

VPORT is the P0 foundational identity and management surface for the VCSM platform. It is ACTIVE but carries significant open security debt. Multiple VENOM, ELEKTRA, BLACKWIDOW, and SENTRY audits have run across VPORT sub-surfaces between 2026-05-10 and 2026-06-01. As of 2026-06-02, the feature has 27 open security findings spanning CRITICAL, HIGH, and MEDIUM severity. The booking domain (TICKET-BOOKING-RPC-001) is DB-BLOCKED pending state-machine RPC migration. The locksmith surface (S-BLK-001) is a hard BEFORE RELEASE blocker — three write paths have no ownership gate. TICKET-0004 (schedule coordinator) and TICKET-0009 (settings security backfill) are both COMPLETE. SPIDER-MAN is BLOCKED with 7 CRITICAL + 7 HIGH missing regression tests. Before any release gate can be cleared on this feature, S-BLK-001 must be resolved and a full post-remediation SENTRY + SPIDER-MAN pass must run.
