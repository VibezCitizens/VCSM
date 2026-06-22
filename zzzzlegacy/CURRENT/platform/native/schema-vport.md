# Module: Supabase schema usage — vport

## PWA Source of Truth

**Routes:** VPORT profile/menu/settings/dashboard/public routes

**Screens/components:**
- `apps/VCSM/src/features/vport/*`
- `apps/VCSM/src/features/settings/vports/*`
- `apps/VCSM/src/features/public/vportMenu/*`
- `apps/VCSM/src/features/dashboard/vport/*`

**Services/DAL:**
- `apps/VCSM/src/services/supabase/vportClient.js`
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`
- `apps/VCSM/src/features/settings/vports/dal/*`
- `apps/VCSM/src/features/public/vportMenu/dal/*`

**Supabase schema/tables/RPCs:**
- `vport.profiles`
- `vport.profile_public_details`
- `vport.profile_categories`
- `vport.categories`
- `vport.public_menu_read_model_v`
- `vport.set_business_card_publish_state`
- `vport.resources`, `vport.bookings`, `vport.availability_rules`, `vport.availability_exceptions`, `vport.resource_services`, `vport.service_booking_profiles`
- `vport.services`, `vport.service_catalog`, `vport.rates`
- `vport.fuel_prices`, `vport.fuel_price_submissions`, `vport.station_price_settings`, `vport.fuel_price_submission_reviews`
- `vport.menu_categories`, `vport.menu_items`, `vport.ads`

**RLS expectations:** Public VPORT reads must use public views or anon-safe rows; owner dashboard/settings writes require owner actor links.

**Current PWA status:** PWA comments explicitly state `vport.profiles` is canonical and legacy `vc.vports` is no longer used for core VPORT profile records.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Profile/DAL/ProfileHandleReads.dal.swift`
- `VCSMNativeApp/Features/Settings/VPortRestoreScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`

---

## Native Behavior Currently Present

- Native has some `vport` schema reads for handle/profile/restore paths.
- Native public menu now uses `vport.public_menu_read_model_v` (migrated from `vc_public` on 2026-05-04).
- All `vc.vport_*` prefixed tables migrated to `vport.*` schema with stripped prefixes (2026-05-09): services, service_catalog, rates, fuel_prices, fuel_price_submissions, station_price_settings, fuel_price_submission_reviews, menu_categories, menu_items, ads.
- All `vc.booking_*` prefixed tables migrated to `vport.*` (2026-05-09): resources, availability_rules, availability_exceptions, resource_services, service_booking_profiles, bookings.

---

## Native Gaps

- Native VPORT writes/deletes must be audited for legacy `vc.vports` usage and aligned to `vport.profiles`/RPCs.
- `vc_public` schema no longer referenced anywhere in native codebase (confirmed 2026-05-04 via grep).
- Zero `vport_` prefixed table references remain in native codebase (confirmed 2026-05-09 via grep).
- Zero `booking_` prefixed table references remain in native codebase (confirmed 2026-05-09 via grep).

---

## Risk Notes

- `vport.core.dal.js` documents: "All VPORTs are in `vport.profiles`; legacy `vc.vports` is no longer used."
- Any native path that writes or deletes `vc.vports` must be quarantined before launch.

---

## Pending Transfer Checklist

- [ ] Search any first-batch native files for `vc.vports` before editing.
- [ ] Use `vport.profiles` and vport RPCs for all VPORT profile/business-card state.
- [ ] Update this tracker whenever PWA vport schema changes.

---

## PWA → Native Transfer Log

- Date:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Transfer History

- Last synced date: 2026-05-09
- Native files updated: 18 DAL files across Booking, Dashboard, Profile, GasPrices features — all migrated from `vc.booking_*` / `vc.vport_*` to `vport.*`
- Delta status: Near-complete — all `vc_public`, `vport_`-prefixed, and `booking_`-prefixed table references eliminated from native codebase; legacy `vc.vports` write paths still need audit
- Notes: Comprehensive schema migration: booking DALs (7 files), dashboard DALs (5 files: Calendar, Services, Gas, Exchange, Ads), profile DALs (6 files: ContentReads, MenuReads, MenuWrites, GasWrites, ServicesWrites, RatesWrites), GasPrices DAL, VPortServicesEditorScreen. All verified zero Xcode issues.

### Previous entries

- Synced: 2026-05-04
- Delta: Partial — `vc_public` eliminated; `vc.vport_*` and `vc.booking_*` prefixed tables still used
- Notes: Public menu migrated from `vc_public` to `vport.public_menu_read_model_v`.

### Previous entries

- Synced: 2026-05-03
- Delta: Partial — vc_public alias unconfirmed; legacy vc.vports paths may remain
- Notes: Initial tracker from ROADTRIP.docx May 3 refresh

---

## Archived Notes

No archived notes yet.
