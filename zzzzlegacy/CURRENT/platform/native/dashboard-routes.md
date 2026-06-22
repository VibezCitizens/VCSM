# Module: Dashboard routes

## Deep Audit Reference

Full structural + data + native transfer spec:
```
native-transfer/modules/dashboard-vport-deep-audit.md
```
This document contains the complete card grid config, VPort type → preset mapping, Supabase column contracts per screen, owner guard pattern, native implementation specs for leads/team, and recommended implementation batch order.

---

## PWA Source of Truth

**Routes:**
- `/actor/:actorId/dashboard`
- `/actor/:actorId/dashboard/gas`
- `/actor/:actorId/dashboard/reviews`
- `/actor/:actorId/dashboard/services`
- `/actor/:actorId/dashboard/exchange`
- `/actor/:actorId/dashboard/calendar`
- `/actor/:actorId/dashboard/portfolio`
- `/actor/:actorId/dashboard/locksmith`
- `/actor/:actorId/dashboard/booking-history`
- `/actor/:actorId/dashboard/leads`
- `/actor/:actorId/dashboard/team`
- `/actor/:actorId/dashboard/team-requests`
- `/actor/:actorId/dashboard/schedule`

**Screens/components:**
- `apps/VCSM/src/features/dashboard/vport/screens/*`
- `apps/VCSM/src/features/dashboard/flyerBuilder/*`

**Services/DAL:**
- `apps/VCSM/src/features/dashboard/vport/dal/*`
- `apps/VCSM/src/features/dashboard/vport/controller/*`

**Supabase schema/tables/RPCs:**
- vc dashboard tables
- vport profile/details tables
- reviews dashboard views
- booking tables

**RLS expectations:** Every dashboard read/write must be owner-only for the active actor and must not resolve by untrusted route actor alone.

**Current PWA status:** Source of truth includes leads, team, team-requests, and schedule routes in addition to the existing native route set.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Dashboard/*`
- `VCSMNativeApp/Navigation/AppRouteParser.swift`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift`

---

## Native Behavior Currently Present

- Native has: dashboard overview, gas, reviews, services, exchange, calendar, portfolio, locksmith, booking history, owner settings, VPORT ads, and flyer design studio routes/screens.
- Schedule route now wired to `OwnerDashboardCalendarViewScreen`, confirming that native calendar intentionally replaces PWA schedule as a single unified view.

---

## Native Gaps

- Dashboard owner guard audit not yet complete (verify actorId-based guard on every route).
- "Add barber" invite flow not yet implemented (team screen has remove but not invite).
- Analytics metrics have no backend — blocked until backend is built.

---

## Risk Notes

- `apps/VCSM/src/app/routes/protected/app.routes.jsx:204-213` defines leads/team/team-requests/schedule routes.
- `AppRouteParser.swift:369-391` handles current native dashboard subroutes.
- Do not add/delete/rename route cases in `NativeAppRoute.swift` without a route audit.

---

## Pending Transfer Checklist

- [x] Add native route cases for leads, team, team-requests — card keys wired in `OwnerDashboardViewScreen`, screens in `OwnerDashboardScreen`.
- [x] Schedule route wired to `OwnerDashboardCalendarViewScreen` — intentional mapping to native calendar.
- [x] Implement leads screen — DAL (`DashboardLeads.dal.swift`), model/controller (`DashboardLeads.controller.swift`), full UI with summary pills, lead cards, mark-contacted, delete.
- [x] Implement team screen — DAL (`DashboardTeam.dal.swift`), model/controller (`DashboardTeam.controller.swift`), full UI with active/declined sections, remove with confirmation.
- [x] Implement team-requests screen — shares `TeamDashboardStore`, filters to pending members.
- [x] Verify dashboard home card grid is VPort-type-aware in native — all 8 presets updated to match PWA spec, 3 new card keys (leads, team, reviewsQr) added.
- [ ] Verify dashboard owner guards for every route (actorId match, not profileId).
- [ ] Implement "Add barber" invite flow for team screen.
- [ ] Do NOT implement analytics metrics — no backend data source exists in PWA or Supabase as of this audit.

---

## PWA → Native Transfer Log

### 2026-05-03 — Deep audit: full dashboard read, transfer document generated

- Date: 2026-05-03
- Change type: Audit / Transfer Document
- PWA files changed: none
- Routes affected: all 13 dashboard routes
- Screens/components changed: none — read-only audit
- Services/DAL changed: none
- Behavior change: none
- Supabase schema/RPC change: none
- RLS expectations changed: no
- Affected native modules: Dashboard routes
- Priority: P1
- Native status: Partial — deep audit complete; full transfer spec written to `dashboard-vport-deep-audit.md`
- Testing notes: No code changed. Document is AI-readable transfer reference.
- Notes: Confirmed leads screen is fully backed by `vport.business_card_leads`. Team screen is backed by `vport.resources`. Analytics (views, impressions, traffic) do not exist in any PWA layer — not implemented and blocked until backend is built.

---

### 2026-05-03 — Schedule route wired, leads/team/team-requests investigated

- Date: 2026-05-03
- Change type: Feature / Investigation
- PWA files changed: none
- Routes affected: `/actor/:actorId/dashboard/schedule`
- Screens/components changed: `OwnerDashboardScreen.swift` (schedule placeholder replaced with `OwnerDashboardCalendarViewScreen`)
- Services/DAL changed: none — reuses existing calendar/booking DAL
- Behavior change: Schedule now shows full calendar view instead of placeholder
- Supabase schema/RPC change: none
- RLS expectations changed: no
- Affected native modules: Dashboard routes, Booking
- Priority: P1
- Native status: Partial — schedule resolved; leads/team/team-requests deferred (no DB backing)
- Testing notes: Build-verified via Xcode diagnostics. Runtime calendar test already covers this path.
- Notes: Investigated PWA leads/team/team-requests routes — they are route stubs with no backing DB tables or DAL. Native placeholders are adequate until backend support is added.

---

## Transfer History

- Last synced date: 2026-05-04
- Native files updated: `DashboardLeads.dal.swift` (new), `DashboardLeads.controller.swift` (new), `DashboardTeam.dal.swift` (new), `DashboardTeam.controller.swift` (new), `DashboardSecondaryRows.dal.swift` (added row types), `DashboardCardCatalog.model.swift` (3 keys added), `DashboardViewByVportType.model.swift` (all 8 presets updated), `OwnerDashboardViewScreen.swift` (route mapping for new keys), `OwnerDashboardScreen.swift` (leads/team/team-requests full screens)
- Delta status: Near-complete — all screens implemented and build-verified; owner guard audit and add-barber invite flow remain
- Notes: Leads, Team, and Team-requests screens fully implemented with DAL→Model→Controller→Store→View pattern. Card grid is now type-aware with all 8 PWA presets. Runtime testing pending.

### Previous entries

- Synced: 2026-05-03
- Delta: Partial — schedule resolved; deep audit complete; leads/team/team-requests are P1 (CONFIRMED DB-backed in PWA)
- Notes: CORRECTION — leads IS backed by `vport.business_card_leads`. Team IS backed by `vport.resources`. Full implementation spec in `dashboard-vport-deep-audit.md`. Schedule wired to calendar intentionally.

---

## Archived Notes

Prior ROADTRIP (pre-May 3) marked dashboard as Complete. May 3 recheck of `app.routes.jsx` revealed 4 missing dashboard subroutes. Status corrected to Partial.
