# Module: Explore / search

## PWA Source of Truth

**Routes:** `/explore`

**Screens/components:**
- `apps/VCSM/src/features/explore/*`

**Services/DAL:**
- `apps/VCSM/src/features/explore/dal/*`
- `apps/VCSM/src/features/explore/hooks/*`
- `apps/VCSM/src/features/explore/ui/*`

**Supabase schema/tables/RPCs:**
- `identity.search_actor_directory` RPC
- `identity.actor_directory`
- vc actors
- vport profile/category rows

**RLS expectations:** Search should return only public/searchable directory records and must not expose owner-only vport profile data.

**Current PWA status:** Source of truth for citizens/vports/wanders tab behavior, chips, result cards, and search RPC contract.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Feed/FeedExploreView.swift`
- `VCSMNativeApp/Services/Feed/LiveFeedService.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`

---

## Native Behavior Currently Present

- Native explore view, filter chips, search RPC call, and result routing exist.
- `SupabaseClient.swift:1234` calls `search_actor_directory`.
- Native actor search, actor-directory browsing, mention suggestions, post search actor hydration, and profile handle lookups now use `identity.search_actor_directory` / `identity.actor_directory`, not retired `vc.actor_presentation`.

---

## Native Gaps

- Wanders results are route-gated off by `NativeFeatureGate`.
- PWA tabs/categories and card metadata parity not verified.
- Empty/error/loading states not confirmed to match source behavior.
- Runtime explore/profile search regression not yet run after schema alignment.

---

## Risk Notes

- Search can expose private actors if directory/RLS assumptions drift — must stay on `identity.search_actor_directory` RPC, not raw owner-only profile tables.
- Explore relies on the same slug/actor route parser as profiles and public VPORT modules.
- `vc.actor_presentation` is not present in the current DB snapshot and must remain unused by native.

---

## Pending Transfer Checklist

- [x] Compare native filter chips to PWA citizens/vports/wanders tabs — verified 2026-05-04: 5 core filters match (all/users/vports/posts/groups). "Groups" label aligned to PWA "Districts". Search placeholder updated.
- [ ] Verify search result routes for user profile, VPORT profile, public menu/card, and Wanders.
- [x] Keep directory search on `identity` RPC rather than raw owner-only profile tables.
- [x] Remove native reads from retired `vc.actor_presentation`.

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

- Last synced date: 2026-05-04
- Native files updated: `ExploreModels.swift` (Groups→Districts label), `FeedExploreView.swift` (search placeholder)
- Delta status: Partial — filter chips aligned to PWA; Wanders gate off; runtime search/routing verification remains
- Notes: 5 core filters match PWA exactly (all/users/vports/posts/groups). "Groups" display label changed to "Districts" to match PWA. Search placeholder updated to include "districts".

### Previous entries

- Synced: 2026-05-03
- Delta: Partial — Wanders gate off, tab/card parity unverified
- Notes: Initial tracker from ROADTRIP.docx May 3 refresh

### 2026-05-03 — Runtime schema alignment

- Date: 2026-05-03
- Change type: Fix / Schema
- PWA files changed: none — alignment to `_HISTORY/db/snapshots/schema_20260502b.sql`
- Routes affected: `/explore`, profile handle resolution, mention suggestions
- Screens/components changed: none
- Services/DAL changed: `SupabaseClient.swift`, `ProfileReads.dal.swift`, `ProfileHandleReads.dal.swift`
- Behavior change: native no longer reads retired `vc.actor_presentation`; actor rows hydrate from `identity.actor_directory` or `identity.search_actor_directory`
- Supabase schema/RPC change: `identity.actor_directory`, `identity.search_actor_directory`
- RLS expectations changed: no — identity directory RLS/search rules remain source of truth
- Affected native modules: Explore, Profile, Chat start, Post detail/search
- Priority: P0
- Native status: Risky — build verified
- Testing notes: iOS simulator `xcodebuild` passed; static scan found no native `actor_presentation` references. Runtime explore/profile regression not yet run.
- Notes: Addresses screenshot error `relation "vc.actor_presentation" does not exist`.

---

## Archived Notes

No archived notes yet.
