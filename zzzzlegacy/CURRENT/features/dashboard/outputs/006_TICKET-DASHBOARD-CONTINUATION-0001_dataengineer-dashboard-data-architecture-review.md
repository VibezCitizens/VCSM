# DataEngineer Audit Report
## TICKET-DASHBOARD-CONTINUATION-0001 — Phase 6: Data Architecture Review

**Date:** 2026-06-04
**Scope:** apps/VCSM/src/features/dashboard/ — all DALs, controllers, hooks
**Triggered by:** TICKET-DASHBOARD-CONTINUATION-0001 Phase 6
**Application Scope:** VCSM

---

## 1. Scope Reviewed

Routes / Screens:
- Dashboard entry screen (VportDashboardScreen)
- Bookings card (VportDashboardBookingHistoryScreen)
- Schedule card (VportDashboardScheduleScreen)
- Gas Prices card
- Leads card
- Portfolio card
- Settings card
- Team card

DAL files reviewed:
- vportProfile.read.dal.js
- vportResource.read.dal.js
- listVportBookingsForProfileDay.read.dal.js
- vportBookingsInRange.read.dal.js
- vportAvailabilityRules.read.dal.js
- vportFuelPrices.read.dal.js + write.dal.js
- vportFuelPriceSubmissions.read.dal.js
- vportStationPriceSettings.read.dal.js
- vportTeam.read.dal.js (findEligibleBarberActorIdsDAL)
- vportOwnerStats.controller.js
- loadDaySchedule.controller.js
- getVportGasPrices.controller.js

Shared service reviewed:
- resolveVportProfileId.dal.js (profiles feature — shared cache layer)

---

## 2. Query Inventory

| # | File | Table/View | Operation | Key Filters | Called From | Round Trips |
|---|---|---|---|---|---|---|
| Q-01 | vportProfile.read.dal.js | vport.profiles | SELECT id | eq(actor_id) | Every mutating controller | 1 RT / call |
| Q-02 | vportProfile.read.dal.js | vport.profiles | SELECT id,name,slug,etc. | eq(actor_id) | readVportProfileByActorIdDAL | 1 RT / call |
| Q-03 | vportProfile.read.dal.js | vport.profiles | SELECT actor_id | eq(id) | getVportActorIdByProfileIdDAL | 1 RT / call |
| Q-04 | vportResource.read.dal.js | vport.resources | SELECT * | eq(profile_id) | loadDaySchedule + stats | 1 RT |
| Q-05 | vportResource.read.dal.js | vport.resources | SELECT * | eq(owner_actor_id) | loadDaySchedule | 1 RT |
| Q-06 | vportAvailabilityRules.read.dal.js | vport.availability_rules | SELECT * | in(resource_id) | loadDaySchedule | 1 RT (batch) |
| Q-07 | listVportBookingsForProfileDay.read.dal.js | vport.bookings | SELECT * | in(resource_id) + date range | loadDaySchedule + stats | 1 RT (batch) |
| Q-08 | vportBookingsInRange.read.dal.js | vport.bookings | SELECT * | eq(resource_id) | availability check | 1 RT / resource |
| Q-09 | vportOwnerStats.controller.js | vport.resources | SELECT meta | eq(profile_id) + eq(resource_type='staff') | useOwnerQuickStats | 1 RT |
| Q-10 | vportOwnerStats.controller.js | vport.resources | SELECT * via DAL | eq(profile_id) | useOwnerQuickStats | 1 RT |
| Q-11 | vportOwnerStats.controller.js | vport.bookings | SELECT * via DAL | in(resource_id) + today range | useOwnerQuickStats | 1 RT |
| Q-12 | vportOwnerStats.controller.js | vport.bookings | SELECT * via DAL | in(resource_id) + upcoming range | useOwnerQuickStats | 1 RT |
| Q-13 | vportFuelPrices.read.dal.js | vport.fuel_prices | SELECT * | eq(profile_id) | getVportGasPrices | 1 RT (TTL 60s ✓) |
| Q-14 | vportFuelPriceSubmissions.read.dal.js | vport.fuel_price_submissions | SELECT * | eq(profile_id)+eq(status='pending') | getVportGasPrices | 1 RT (TTL 30s ✓) |
| Q-15 | vportStationPriceSettings.read.dal.js | vport.station_price_settings | SELECT * | eq(profile_id) | getVportGasPrices | 1 RT (TTL 5min ✓) |
| Q-16 | vportTeam.read.dal.js | vc.actor_follows | SELECT follower_actor_id | eq(followed_actor_id) | findEligibleBarberActorIdsDAL | 1 RT |
| Q-17 | vportTeam.read.dal.js | vc.actors | SELECT id,kind | in(id) | findEligibleBarberActorIdsDAL | 1 RT |
| Q-18 | vportTeam.read.dal.js | vc.actor_owners | SELECT actor_id,user_id | in(actor_id) (user-kind) | findEligibleBarberActorIdsDAL | 1 RT |
| Q-19 | vportTeam.read.dal.js | vc.actor_owners | SELECT actor_id,... | in(user_id) + actor.kind='vport' join | findEligibleBarberActorIdsDAL | 1 RT |
| Q-20 | vportTeam.read.dal.js | vport.profile_categories | SELECT profile(actor_id) | eq(category_key='barber') + in(profile.actor_id) | findEligibleBarberActorIdsDAL | 1-2 RT |

---

## 3. Duplicate DB Calls

### DE-002 — Duplicate Profile Resolution (NO TTL in Dashboard Local DALs)

- **Finding ID:** DE-002
- **Priority:** MEDIUM
- **Table:** vport.profiles
- **Duplicate sites:**
  - `dashboard/vport/dal/read/vportProfile.read.dal.js` — `getVportProfileIdByActorDAL` (no cache)
  - `dashboard/vport/dal/read/vportProfile.read.dal.js` — `readVportProfileByActorIdDAL` (no cache)
  - `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` — shared, TTL 30s ✓
- **Assessment:** Dashboard's local `vportProfile.read.dal.js` functions duplicate the work done by `resolveVportProfileId`. Every controller that calls `getVportProfileIdByActorDAL` or `readVportProfileByActorIdDAL` issues an uncached DB read, while a TTL-cached version already exists in the profiles feature.
  - `loadDayScheduleController` calls `getVportProfileIdByActorDAL` (1 RT, uncached)
  - `vportOwnerStats.controller.js` calls `readVportProfileByActorIdDAL` (1 RT, uncached)
  - `vportTeam.controller.js` calls `readVportProfileByActorIdDAL` (1 RT, uncached)
  - `vportLeads.controller.js` calls `readVportProfileByActorIdDAL` (1 RT, uncached)
  - Multiple calls happen per session with the same actorId

### DE-003 — Dual Resource Query in Schedule Load (Structural Duplication)

- **Finding ID:** DE-003
- **Priority:** MEDIUM
- **Table:** vport.resources
- **Duplicate sites:**
  - `listVportResourcesByProfileIdDAL({ profileId })` (Q-04)
  - `listVportResourcesByOwnerActorIdDAL({ ownerActorId: actorId })` (Q-05)
  - Both called in `loadDayScheduleController` with dedup via Set
- **Assessment:** Two separate queries to the same table with different ownership filters, then client-side deduplication. Root cause: resources can be attached to a VPORT via either `profile_id` (legacy pattern) or `owner_actor_id` (engine pattern). This is a data model inconsistency, not a query error.

### DE-009 — Booking Count Queries with Overlapping Structure

- **Finding ID:** DE-009
- **Priority:** LOW
- **Table:** vport.bookings
- **Duplicate sites:**
  - `listVportBookingsForProfileDayDAL` called with today range (Q-11)
  - `listVportBookingsForProfileDayDAL` called with upcoming 7-day range (Q-12)
  - Both in `loadOwnerQuickStatsController` — same function, different date ranges
- **Assessment:** These are intentional separate reads (different time ranges). Parallelized with `Promise.all` ✓. Not redundant — just worth noting as 2 booking queries per stats load.

---

## 4. Expensive Chains

### DE-001 — findEligibleBarberActorIdsDAL: 5-6 Sequential DB Round Trips

- **Finding ID:** DE-001
- **Priority:** HIGH
- **Chain:**
  ```
  useVportTeam.hook
    → findEligibleBarbersController
      → resolveProfileId (1 RT — vport.profiles)
      → Promise.all([
          findEligibleBarberActorIdsDAL (5-6 sequential RT)
          fetchTeamMembersByProfileId (1 RT — vport.resources)
        ])
  ```
- **Pattern type:** Serial N-hop lookup chain (not N+1 but multi-step graph traversal)
- **Round trips per load:**
  - RT 1: `vc.actor_follows` WHERE followed_actor_id = barbershopActorId
  - RT 2: `vc.actors` WHERE id IN (followerActorIds)
  - RT 3: `vc.actor_owners` WHERE actor_id IN (userActorIds) — user-kind step 1
  - RT 4: `vc.actor_owners` WHERE user_id IN (userIds) + actors(kind='vport') join — user-kind step 2
  - RT 5: `vport.profile_categories` WHERE profile.actor_id IN (ownedVportActorIds) — barber check (user-kind followers)
  - RT 6 (conditional): `vport.profile_categories` WHERE profile.actor_id IN (vportActorIds) — barber check (vport-kind followers)
  - **Total: 5-6 sequential round trips** for a single team eligibility lookup
- **Business impact:** This query runs when the barbershop owner views the "Add Team Member" modal. A barbershop with many followers (100+) will hit all 6 round trips serially, with significant latency.

### DE-004 — loadOwnerQuickStats: 4 Uncached DB Queries Per Dashboard Open

- **Finding ID:** DE-004
- **Priority:** MEDIUM
- **Chain:**
  ```
  useOwnerQuickStats(actorId)
    → loadOwnerQuickStatsController
      → readVportProfileByActorIdDAL (1 RT — uncached)
      → Promise.all([
          vportSchema.from("resources").select(…)  (1 RT — uncached)
          listVportResourcesByProfileIdDAL (1 RT — uncached)
        ])
      → Promise.all([
          listVportBookingsForProfileDayDAL (today) (1 RT — uncached)
          listVportBookingsForProfileDayDAL (upcoming) (1 RT — uncached)
        ])
  ```
  **Total: 5 DB queries per stats card mount. No caching at any layer.**
- **Pattern type:** Uncached page-load query fan-out
- **Business impact:** Dashboard home — every time the stats card mounts, 5 queries fire. Navigating away and back triggers all 5 again.

### DE-005 — Schedule Load: 5-6 Sequential+Parallel Round Trips Per Day Change

- **Finding ID:** DE-005
- **Priority:** MEDIUM
- **Chain:**
  ```
  useVportOwnerSchedule.load(dateKey)
    → loadDayScheduleController
      Step 1 (serial):  assertActorOwnsVportActorController (1 RT — actor_owners)
      Step 2 (serial):  getVportProfileIdByActorDAL (1 RT — uncached)
      Step 3 (parallel): listVportResourcesByProfileIdDAL + listVportResourcesByOwnerActorIdDAL (2 RT)
      Step 4 (serial):  listVportAvailabilityRulesByResourceIdsDAL (1 RT — batch)
      Step 5 (serial):  listVportBookingsForProfileDayDAL (1 RT — batch)
      Step 6 (serial):  listVportServicesByProfileIdDAL (1 RT)
  ```
  **Total: 6-7 DB round trips per schedule day change**
- **Pattern type:** Serial + parallel mix — steps 4-6 are serial after step 3
- **Optimization opportunity:** Steps 4, 5, 6 could be parallelized once `resourceIds` are known from step 3. Currently only step 3's two queries are parallel.

### DE-006 — listVportBookingsInRangeDAL: Non-Batched Availability Check

- **Finding ID:** DE-006
- **Priority:** LOW
- **Chain:**
  ```
  rescheduleBookingController
    → listVportBookingsInRangeDAL({ resourceId: single })
  ```
  Also used in `getVportResourceAvailabilityController` (single resourceId per call).
- **Pattern type:** Per-resource query (single filter, not batched)
- **Note:** Contrast with `listVportBookingsForProfileDayDAL` which uses `IN (resourceIds)`. This function is called per individual resource, which is appropriate for single-resource availability checks. Not an N+1 per se, but would become one if called in a loop for multi-resource schedule rendering. Currently only used in single-resource contexts.

---

## 5. RPC Candidates

### DE-007 — findEligibleBarberActorIdsDAL → RPC Candidate

- **Finding ID:** DE-007
- **Current query chain:** 5-6 sequential SELECT calls across 4 tables (actor_follows, actors, actor_owners, vport.profile_categories)
- **Proposed RPC signature (text only — do not run automatically):**
  ```sql
  -- Do not run automatically
  CREATE OR REPLACE FUNCTION vc.get_eligible_barber_actors(p_barbershop_actor_id uuid)
  RETURNS TABLE(barber_actor_id uuid)
  LANGUAGE plpgsql SECURITY DEFINER
  AS $$
  BEGIN
    RETURN QUERY
    SELECT DISTINCT pc.profile_actor_id
    FROM vc.actor_follows af
    JOIN vc.actors a ON a.id = af.follower_actor_id AND a.is_void = false
    -- user-kind followers: resolve to their owned VPORT actors
    LEFT JOIN vc.actor_owners ao_user ON ao_user.actor_id = a.id AND a.kind = 'user'
    LEFT JOIN vc.actor_owners ao_vport ON ao_vport.user_id = ao_user.user_id AND ao_vport.is_void = false
    LEFT JOIN vc.actors vport_actor ON vport_actor.id = ao_vport.actor_id AND vport_actor.kind = 'vport' AND NOT vport_actor.is_void AND NOT vport_actor.is_deleted
    -- vport-kind followers: direct check
    LEFT JOIN vc.actors vport_direct ON vport_direct.id = a.id AND a.kind = 'vport'
    -- barber category filter
    JOIN vport.profiles p ON (p.actor_id = COALESCE(vport_actor.id, vport_direct.id) AND p.is_active = true)
    JOIN vport.profile_categories pc ON pc.profile_id = p.id AND pc.category_key = 'barber' AND pc.is_primary = true
    WHERE af.followed_actor_id = p_barbershop_actor_id
      AND af.is_active = true;
  END;
  $$;
  ```
- **Rationale:** Collapses 5-6 round trips into 1. Ownership-safe (reads only — no mutations). Data that crosses two schemas (vc + vport) benefits from server-side join.
- **Risk:** MEDIUM — cross-schema function; SECURITY DEFINER needs RLS review; function must not bypass actor privacy
- **Owner:** DB → Carnage → Venom

---

## 6. View Candidates

### DE-008 — VPORT Dashboard Summary View

- **Finding ID:** DE-008
- **Tables joined:** vport.profiles + vport.resources + vport.bookings (aggregated)
- **Features that would consume:** `loadOwnerQuickStatsController`, `vportOwnerStats`
- **Proposed view definition (text only — do not run automatically):**
  ```sql
  -- Do not run automatically
  CREATE VIEW vport.owner_dashboard_summary AS
  SELECT
    p.actor_id,
    p.id AS profile_id,
    COUNT(DISTINCT r.id) FILTER (WHERE r.resource_type='staff' AND r.meta->>'status'='linked' AND r.is_active) AS active_barber_count,
    COUNT(b_today.id) AS today_booking_count,
    COUNT(b_upcoming.id) AS upcoming_booking_count
  FROM vport.profiles p
  LEFT JOIN vport.resources r ON r.profile_id = p.id AND r.resource_type = 'staff'
  LEFT JOIN vport.bookings b_today ON b_today.profile_id = p.id
    AND b_today.starts_at::date = CURRENT_DATE
    AND b_today.status NOT IN ('cancelled','no_show')
  LEFT JOIN vport.bookings b_upcoming ON b_upcoming.profile_id = p.id
    AND b_upcoming.starts_at::date BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 8
    AND b_upcoming.status NOT IN ('cancelled','no_show')
  GROUP BY p.actor_id, p.id;
  ```
- **Note:** This is a MATERIALIZED VIEW candidate — counts could be refreshed every 5 minutes via pg_cron rather than computed per request. Recommend MATERIALIZED VIEW instead of live VIEW for performance.
- **Owner:** DB → Carnage → Venom

---

## 7. Cache Candidates

### DE-010 — loadOwnerQuickStats: Short TTL Cache Candidate

- **Finding ID:** DE-010
- **DAL file:** `vportOwnerStats.controller.js`
- **Read frequency:** On every dashboard screen mount; again when user returns to tab (useOwnerQuickStats has focus/visibility re-fetch via useVportOwnership)
- **Mutation frequency:** Every booking create/update/cancel → cache should invalidate
- **Recommended TTL:** 60 seconds (stats are informational, not real-time)
- **Cache invalidation required on:** insertVportBookingDAL, updateVportBookingDAL, after booking status updates
- **Note:** The stats function reads profiles, resources, and bookings. If an owner quickStats cache is added, it must be invalidated on booking mutations that go through the dashboard.

### DE-011 — getVportProfileIdByActorDAL / readVportProfileByActorIdDAL: Should Delegate to resolveVportProfileId

- **Finding ID:** DE-011
- **DAL file:** `dashboard/vport/dal/read/vportProfile.read.dal.js`
- **Read frequency:** Multiple times per session per controller call
- **Mutation frequency:** Profile changes are rare
- **Recommended TTL:** Delegate to `resolveVportProfileId.dal.js` which already has a 30s TTL cache
- **Note:** `resolveVportProfileId` is already used by the gas prices DALs and avoids re-reads. The dashboard's own profile resolution functions bypass this cache entirely. The fix: update `getVportProfileIdByActorDAL` to call `resolveVportProfileId` (or ensure all callers use it directly).

---

## 8. Backend Ownership Decision

| Finding ID | Owner | Rationale |
|---|---|---|
| DE-001 | DB → Carnage | 5-RT graph traversal — RPC in DB layer collapses to 1 RT |
| DE-002 | VCSM feature owner | Use shared `resolveVportProfileId` cache in dashboard DALs |
| DE-003 | VCSM feature owner + Carnage | Dual resources query is a data model issue — CARNAGE can add a composite index or consolidate the attachment model |
| DE-004 | VCSM feature owner | Add TTL cache to stats controller output |
| DE-005 | VCSM feature owner | Parallelize steps 4-6 in loadDayScheduleController |
| DE-006 | VCSM feature owner | Keep as-is for now — only N+1 if called in a loop (it isn't currently) |
| DE-007 | DB → Carnage → Venom | RPC creation with cross-schema join |
| DE-008 | DB → Carnage | Materialized view for owner dashboard stats |
| DE-009 | N/A — intentional | Two date range queries are correct behavior |
| DE-010 | VCSM feature owner | TTL cache on stats output |
| DE-011 | VCSM feature owner | Refactor profile resolution to use shared cache |

---

## 9. Recommended Patch Plan

| Priority | Finding ID | Change Type | File(s) | Recommended Action | Risk | Owner |
|---|---|---|---|---|---|---|
| P1 | DE-001, DE-007 | RPC | DB migration (Carnage) | Create `vc.get_eligible_barber_actors(barbershopActorId)` RPC; update `findEligibleBarberActorIdsDAL` to call `supabase.rpc('get_eligible_barber_actors', ...)` | MEDIUM | DB + Carnage + Venom |
| P2 | DE-004, DE-010 | Cache | vportOwnerStats.controller.js | Add 60s TTL cache on stats result keyed by actorId; invalidate on booking writes | LOW | VCSM feature owner |
| P2 | DE-002, DE-011 | DAL cleanup | dashboard/vport/dal/read/vportProfile.read.dal.js | Refactor `getVportProfileIdByActorDAL` to call `resolveVportProfileId`; share the 30s TTL cache | LOW | VCSM feature owner |
| P2 | DE-005 | Parallelization | loadDaySchedule.controller.js | Parallelize `listVportAvailabilityRulesByResourceIdsDAL`, `listVportBookingsForProfileDayDAL`, and `listVportServicesByProfileIdDAL` once resourceIds are known | LOW | VCSM feature owner |
| P3 | DE-003 | Schema | DB migration (Carnage) | Consider adding a resources_view that unions profile_id-based and owner_actor_id-based resources; or consolidate attachment model | MEDIUM | Carnage |
| P3 | DE-008 | View | DB migration (Carnage) | Create `vport.owner_dashboard_summary` materialized view; refresh via pg_cron | HIGH | DB + Carnage |

---

## 10. Required Downstream Reviews

- **DB** — Verify `vc.actor_follows`, `vc.actors`, `vc.actor_owners`, `vport.profile_categories` table structure and indexes before RPC creation; verify whether a composite index on (resource_type, profile_id) exists on vport.resources; inspect query plan for `listVportBookingsForProfileDayDAL` with IN filter
- **Carnage** — Migration planning for DE-007 (RPC), DE-003 (resources schema), DE-008 (materialized view)
- **Venom** — RLS review for any DB function created (especially SECURITY DEFINER `get_eligible_barber_actors`) — must confirm it cannot bypass actor privacy or expose blocked/private actors
- **Kraven** — Runtime timing measurement on `findEligibleBarberActorIdsDAL` for a barbershop with 50+ followers to validate priority of DE-001; measure `loadDayScheduleController` round-trip count in production
- **SENTRY** — Verify that any cache invalidation on booking mutations is wired correctly to avoid serving stale dashboard stats after a write

---

## DATA ARCHITECTURE REVIEW

| Finding ID | Current Pattern | Recommended Object Type | Proposed Object | Reason |
|---|---|---|---|---|
| DE-001 | 5-6 sequential SELECT across actor_follows, actors, actor_owners, profile_categories | RPC | `vc.get_eligible_barber_actors(barbershopActorId)` | Cross-schema graph traversal belongs in DB layer; collapses to 1 RT |
| DE-004 | 4 uncached parallel reads per dashboard mount | CACHE TABLE (or in-memory TTL) | Stats TTL cache keyed by actorId | Stats are informational; 60s TTL acceptable |
| DE-008 | 3 separate booking count + staff count queries | MATERIALIZED VIEW | `vport.owner_dashboard_summary` | Aggregate counts don't change in real-time; mat view + refresh interval is efficient |
| DE-003 | 2 queries to same table (resources) via different ownership columns | SOURCE TABLE (schema fix needed) | Resources attachment model unification | Dual attachment pattern causes structural duplication at query layer |
| Q-13/14/15 | 3 reads per gas card mount | CACHE TABLE (already implemented ✓) | TTL caches in DAL layer | Gas prices: 60s / submissions: 30s / settings: 5min ✓ |

---

## RELATIONSHIP ARCHITECTURE CANDIDATES

| Finding ID | Relationship | Current Tables | Proposed Edge Table | Consumers | Risk |
|---|---|---|---|---|---|
| N/A | VPORT owns Resource | vport.resources (profile_id + owner_actor_id) | N/A — source table consolidation preferred | Schedule card, team card, stats | LOW |
| N/A | Barbershop follows eligible Barber | Derived from actor_follows + actor_owners + profile_categories | `vc.barbershop_barber_eligibility_edge` | Team card (findEligibleBarbersController) | MEDIUM — needs invalidation on follow/unfollow |

---

## PRECOMPUTED READ MODEL CANDIDATES

| Finding ID | Current Query Pattern | Recommended Type | Proposed Object | Refresh / Invalidation Strategy |
|---|---|---|---|---|
| DE-004 | 4 uncached queries: profile + 2×resources + 2×bookings | CACHE TABLE or TTL cache | `loadOwnerQuickStats` TTL cache (60s) | Invalidate on booking INSERT/UPDATE; invalidate on resource changes |
| DE-008 | stats queries on every dashboard open | MATERIALIZED VIEW | `vport.owner_dashboard_summary` | pg_cron every 5 minutes; also refresh on booking mutations via trigger |
| DE-001 | 5-RT barber eligibility lookup | CACHE TABLE | `vc.barbershop_barber_eligibility_cache` (or RPC) | Invalidate on actor_follows changes for that barbershopActorId |

---

## Cache Audit Summary

| Module | DAL | Cache Type | TTL | Invalidation Path | Status |
|---|---|---|---|---|---|
| Gas Prices (official) | vportFuelPrices.read.dal.js | In-memory TTL | 60s | invalidateFuelPriceCache | GOOD ✓ |
| Gas Prices (submissions) | vportFuelPriceSubmissions.read.dal.js | In-memory TTL | 30s | invalidatePendingSubmissionsCache | GOOD ✓ |
| Gas Prices (settings) | vportStationPriceSettings.read.dal.js | In-memory TTL | 5min | invalidateSettingsCache | GOOD ✓ |
| Profile ID resolution | resolveVportProfileId.dal.js | In-memory TTL | 30s | Not present (profile stable) | GOOD ✓ |
| Dashboard profile reads | vportProfile.read.dal.js | NONE | N/A | N/A | GAP — use resolveVportProfileId |
| Owner quick stats | vportOwnerStats.controller.js | NONE | N/A | N/A | GAP — add 60s TTL |
| Schedule resources | vportResource.read.dal.js | NONE | N/A | N/A | Acceptable for owner-only views |
| Availability rules | vportAvailabilityRules.read.dal.js | NONE | N/A | N/A | Low volume — acceptable |
| Bookings (day) | listVportBookingsForProfileDay.read.dal.js | NONE | N/A | N/A | Real-time required — no cache |
| Team eligibility | vportTeam.read.dal.js (findEligibleBarberActorIdsDAL) | NONE | N/A | N/A | HIGHEST PRIORITY CACHE CANDIDATE |

---

*DataEngineer audit complete. No code modified. All SQL and schema changes are proposals only — do not run automatically. All cross-schema recommendations require DB → Carnage → Venom review before execution.*
