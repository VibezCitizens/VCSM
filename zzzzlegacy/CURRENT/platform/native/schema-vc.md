# Module: Supabase schema usage — vc

## PWA Source of Truth

**Routes:** Cross-cutting — most authenticated product modules

**Services/DAL:**
- `apps/VCSM/src/services/supabase/vcClient.js`
- `apps/VCSM/src/features/feed/*`
- `apps/VCSM/src/features/post/*`
- `apps/VCSM/src/features/social/*`

**Supabase schema/tables/RPCs:**
- `vc.actors`
- `vc.posts`
- `vc.post_media`
- `vc.actor_follows`
- `vc.inbox_entries`
- `vc.actor_privacy_settings`
- `vc.vports` (legacy — no longer used for core VPORT records)

> **Note:** Booking tables have moved to the `vport` schema. See [booking.md](booking.md) for the correct table names (`vport.resources`, `vport.availability_rules`, `vport.availability_exceptions`, `vport.resource_services`, `vport.service_booking_profiles`, `vport.bookings`). Do not use `vc.booking_*` names.

> **Runtime schema note:** Current DB snapshot does not expose `vc.actor_presentation` or `vc.notifications`. Native actor directory reads must use `identity.actor_directory` / `identity.search_actor_directory`; native notification reads/writes must use `notification.inbox_full_view`, `notification.recipients`, and `notification.inbox_items`.

**RLS expectations:** `vc` schema is mostly authenticated and actor-scoped; raw writes must preserve active actor ownership and must avoid legacy table paths where PWA has migrated away.

**Current PWA status:** PWA uses `vc` heavily for actor/feed/post/social. Booking source of truth has migrated to `vport.*`. VPORT profile source of truth has migrated to `vport.profiles`.

---

## Native Transfer Status

**Status:** `Risky`

---

## Transferred Native Files

- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Features/Dashboard/DAL/*`
- `VCSMNativeApp/Features/Profile/DAL/*`

---

## Native Behavior Currently Present

- Native `SupabaseClient` and feature DALs use `schema: "vc"` extensively.
- Native feed/post/profile/chat paths are built on `vc` schema calls.
- P0 scoped native service paths now use `moderation` schema/RPCs for block/report and `delete_my_vport` for VPORT delete fallback removal.
- Runtime schema alignment now removes native reads from retired `vc.actor_presentation`, retired `vc.notifications`, legacy `vc.user_blocks`, and non-existent `moderation.blocks.id`.

---

## Native Gaps

- Scoped block/report writes no longer use `vc` tables in `SupabaseClient.swift`; runtime moderation RPC behavior remains untested.
- Direct `vc.vports` delete fallback has been removed from the scoped settings path; `vport.profiles` parity still needs verification.
- Native booking DAL files may still reference stale `vc.booking_*` names — must be verified and updated to `vport.*`.

---

## Risk Notes

- Before any native change, confirm whether a table is a canonical `vc` source or a legacy/migrated surface.
- `vc.vports` writes and deletes should be treated as legacy paths — quarantine or remove them.
- `vc.user_blocks` and `vc.reports`/`vc.report_events` scoped native writes were replaced with `moderation` RPC/schema paths on 2026-05-03 — see [moderation.md](moderation.md).
- `vc.actor_presentation` and `vc.notifications` are not current runtime surfaces; see [explore-search.md](explore-search.md) and [notifications.md](notifications.md).
- `vc.booking_*` does not exist as a canonical path. Booking tables live in the `vport` schema — see [booking.md](booking.md).

---

## Pending Transfer Checklist

- [x] Document every `vc` table touched by the first implementation batch.
- [ ] Verify each write is authenticated and actor-owner scoped.
- [x] Remove or quarantine legacy `vc.vports` delete/write paths.
- [x] Remove native dependencies on retired `vc.actor_presentation` and `vc.notifications`.
- [ ] Verify native booking DAL does not use stale `vc.booking_*` names.

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

- Last synced date: 2026-05-03
- Native files updated: `SupabaseClient.swift`, `LiveSettingsService.swift`, `SupabaseNotificationModels.swift`, `SupabaseSettingsModels.swift`, `SafetyReads.dal.swift`, `SafetyRows.dal.swift`, `ProfileReads.dal.swift`, `ProfileHandleReads.dal.swift`, `NotificationsView.swift`
- Delta status: Risky — scoped moderation mismatch, direct VPORT delete fallback, retired actor presentation reads, retired notification reads, and stale block-id reads are build-verified as fixed; broader `vc` write ownership and booking stale-name audit remain open
- Notes: P0 native transfer batch started and build-verified on May 3. Booking tables moved to `vport` schema in a prior PWA session. `vc.booking_*` entries removed from this tracker. See booking.md.

---

## Archived Notes

**Prior tracker entry (stale — corrected 2026-05-02):** Listed `vc.booking_*` as part of vc schema tables. These have been migrated to `vport.*` — `vport.resources`, `vport.availability_rules`, `vport.availability_exceptions`, `vport.resource_services`, `vport.service_booking_profiles`, `vport.bookings`.
