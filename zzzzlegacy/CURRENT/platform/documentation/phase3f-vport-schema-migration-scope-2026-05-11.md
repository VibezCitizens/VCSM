# Logan Phase 3f — Full vport Schema Migration Scope

**Date:** 2026-05-11
**Trigger:** Live schema DDL provided (vport schema tables)
**Scope:** Cross-cutting audit — all Logan docs referencing `vc.vport_*` tables

---

## Summary

Phase 3 code inspection and DB schema verification confirms the `vport` schema migration was **significantly broader than the booking tables**. The entire vport domain moved from `vc.*` → `vport.*`. Many Logan docs still reference the old `vc.vport_*` names.

The booking section (the immediate trigger) has been fully corrected. The tables below represent the **remaining uncorrected drift** across the wider vport domain.

---

## Confirmed vport Schema Table Mapping

From live schema DDL inspection (2026-05-11):

| Old Name (vc schema) | New Name (vport schema) | Notes |
|---|---|---|
| `vc.bookings` | `vport.bookings` | FIXED Phase 3 |
| `vc.booking_resources` | `vport.resources` | FIXED Phase 3 |
| `vc.booking_availability_rules` | `vport.availability_rules` | FIXED Phase 3 |
| `vc.booking_availability_exceptions` | `vport.availability_exceptions` | FIXED Phase 3 |
| `vc.booking_service_profiles` | `vport.service_booking_profiles` | FIXED Phase 3 |
| `vc.booking_resource_services` | `vport.resource_services` | FIXED Phase 3 |
| `vc.vport_services` | `vport.services` | FIXED Phase 3 |
| `vc.vport_public_details` | `vport.profile_public_details` | **PENDING** |
| `vc.vport_actor_menu_categories` | `vport.menu_categories` | **PENDING** — table name also changed |
| `vc.vport_actor_menu_items` | `vport.menu_items` | **PENDING** — table name also changed |
| `vc.vport_rates` | `vport.rates` | **PENDING** |
| `vc.vport_fuel_prices` | `vport.fuel_prices` | **PENDING** |
| `vc.vport_fuel_price_submissions` | `vport.fuel_price_submissions` | **PENDING** |
| `vc.vport_fuel_price_submission_reviews` | `vport.fuel_price_submission_reviews` | **PENDING** |
| `vc.vport_fuel_price_history` | `vport.fuel_price_history` | **PENDING** |
| `vc.vport_portfolio_items` | `vport.portfolio_items` | **PENDING** |
| `vc.vport_portfolio_media` | `vport.portfolio_media` | **PENDING** |
| `vc.vport_portfolio_tags` | `vport.portfolio_tags` | **PENDING** |
| `vc.vport_barber_portfolio_details` | `vport.barber_portfolio_details` | **PENDING** |
| `vc.vport_locksmith_portfolio_details` | `vport.locksmith_portfolio_details` | **PENDING** |
| `vc.vport_locksmith_service_areas` | `vport.locksmith_service_areas` | **PENDING** |
| `vc.vport_locksmith_service_details` | `vport.locksmith_service_details` | **PENDING** |

### Tables confirmed to remain in vc schema

The following were NOT found in the `vport` schema DDL and are presumed to remain in `vc`:
- `vc.actors`, `vc.actor_follows`, `vc.actor_owners`, `vc.actor_privacy_settings` — identity/social layer
- `vc.vport_reviews` — not in vport schema DDL; reviews may remain in `vc` or have moved to `reviews.*` engine schema
- `vc.posts`, `vc.post_comments`, `vc.post_reactions` — social content
- `vc.vports` — the vport actor record itself (the actor row, not the profile)

---

## New vport Tables (No vc Equivalent)

Tables in vport schema with no prior `vc.vport_*` equivalent — these are net-new:

| Table | Purpose |
|---|---|
| `vport.profiles` | Vport profile (was partly `vc.vports` + `vc.vport_public_details`) |
| `vport.categories` | Service categories (was likely `vc.vport_categories` or hardcoded) |
| `vport.profile_categories` | Profile ↔ category join |
| `vport.profile_actor_access` | Actor access/team roles per profile |
| `vport.organizations` | Multi-location org scaffold |
| `vport.locations` | Physical locations under an org |
| `vport.organization_members`, `vport.location_members` | Org/location team membership |
| `vport.organization_profiles` | Org ↔ profile join |
| `vport.qr_links` | QR codes for booking/profile links |
| `vport.resource_service_overrides` | Per-resource service price/duration overrides |
| `vport.service_addons` | Service add-ons |
| `vport.service_catalog` | Seeded catalog of service types |
| `vport.content_pages` | Owner-authored rich-text pages |
| `vport.business_card_leads` | Lead captures from public business card |
| `vport.cities` | City reference table |
| `vport.station_*` | Gas station-specific detail tables |
| `vport.menu_item_media` | Menu item media assets |

---

## Drift Findings

### F-3f-01 — `vc.vport_public_details` references

**Drift Severity:** HIGH  
**Affected docs:**
- `vcsm.vport.business-pipeline.md`
- `vports/vcsm.vport.tripoint-integration.md`
- `vports/vcsm.vport.external-site-integration.md`
- `marvel/architect/vcsm-migration-risk-report.md`

**Correct table:** `vport.profile_public_details`

---

### F-3f-02 — `vc.vport_actor_menu_*` references

**Drift Severity:** HIGH  
**Note:** Table NAME also changed (`vport_actor_menu_categories` → `menu_categories`).  
**Affected docs:**
- `vcsm.runtime.mutation-matrix.md`
- `vcsm.runtime.high-risk-mutations.md`
- `vcsm.vport.business-pipeline.md`
- `vports/vcsm.vport.barber-profile-spec.md`
- `marvel/architect/` files

**Correct tables:** `vport.menu_categories`, `vport.menu_items`, `vport.menu_item_media`

---

### F-3f-03 — `vc.vport_rates` references

**Drift Severity:** MEDIUM  
**Correct table:** `vport.rates`  
**Affected docs:**
- `vcsm.runtime.mutation-matrix.md` (upsert VPORT rate row)
- `vcsm.vport.business-pipeline.md`

---

### F-3f-04 — `vc.vport_fuel_*` references

**Drift Severity:** MEDIUM  
**Correct tables:** `vport.fuel_prices`, `vport.fuel_price_submissions`, `vport.fuel_price_submission_reviews`, `vport.fuel_price_history`, `vport.fuel_types`  
**Affected docs:**
- `vcsm.runtime.mutation-matrix.md` (fuel review officialization row)
- `vcsm.runtime.high-risk-mutations.md` (rank 8)
- `vcsm.vport.business-pipeline.md`

---

### F-3f-05 — `vc.vport_portfolio_*` and locksmith `vc.vport_locksmith_*` references

**Drift Severity:** MEDIUM  
**Correct tables:**
- `vc.vport_portfolio_items` → `vport.portfolio_items`
- `vc.vport_portfolio_media` → `vport.portfolio_media`
- `vc.vport_portfolio_tags` → `vport.portfolio_tags`
- `vc.vport_barber_portfolio_details` → `vport.barber_portfolio_details`
- `vc.vport_locksmith_portfolio_details` → `vport.locksmith_portfolio_details`
- `vc.vport_locksmith_service_areas` → `vport.locksmith_service_areas`
- `vc.vport_locksmith_service_details` → `vport.locksmith_service_details`

**Affected docs:**
- `vcsm.vport.barber-profile-spec.md` (portfolio table references)
- `vports/vcsm.vport.tripoint-integration.md`
- `vcsm.vport.business-pipeline.md`
- `marvel/architect/` files
- `vcsm.platform.pipeline-map.md` (portfolio row)
- `vcsm.platform.read-optimization-plan.md`
- `architecture/database-read-map.md` (portfolio section)

---

### F-3f-06 — `vc.vports` vs `vport.profiles`

**Drift Severity:** LOW (needs code inspection before updating)  
**Note:** `vc.vports` may still exist as the actor-side record; `vport.profiles` is the new profile record. These may be separate entities. Do NOT replace `vc.vports` references until code is inspected to confirm the relationship.

**Action required:** Code inspection of `vport.profiles` usage and `vc.vports` usage before changing any docs.

---

## Phase 3f Action Items

| Priority | Finding | Action | Scope |
|---|---|---|---|
| HIGH | F-3f-01 `vc.vport_public_details` | Update all refs to `vport.profile_public_details` | Logan doc corrections |
| HIGH | F-3f-02 `vc.vport_actor_menu_*` | Update all refs; note name change | Logan doc corrections |
| MEDIUM | F-3f-03 `vc.vport_rates` | Update refs to `vport.rates` | Logan doc corrections |
| MEDIUM | F-3f-04 `vc.vport_fuel_*` | Update refs to `vport.fuel_*` | Logan doc corrections |
| MEDIUM | F-3f-05 `vc.vport_portfolio_*` / locksmith | Update all portfolio/locksmith table refs | Logan doc corrections |
| LOW | F-3f-06 `vc.vports` relationship | Code inspect before changing | Code + doc |

## Resolved by Phase 3 (do not re-address)

- F-3b-01, F-3d-01, F-3e-01 — all RESOLVED. `vport` schema confirmed live; no `vc.bookings` split.
