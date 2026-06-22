# Module: Feed pipeline

## PWA Source of Truth

**Routes:** `/feed`, `/posts`

**Screens/components:**
- `apps/VCSM/src/features/feed/*`
- `apps/VCSM/src/features/post/postcard/*`

**Services/DAL:**
- `apps/VCSM/src/features/feed/hooks/useFeed.js`
- `apps/VCSM/src/features/feed/dal/*`
- `apps/VCSM/src/features/feed/pipeline/*`

**Supabase schema/tables/RPCs:**
- `vc.posts`
- `vc.post_media`
- `vc.post_reactions`
- `vc.post_comments`
- `vc.get_actor_summaries`
- `moderation.blocks` (read path in PWA)
- `vc.actor_follows`
- `vc.actor_privacy_settings`

**RLS expectations:** Feed must be authenticated-only, hide blocked actors, respect private/follow visibility, and avoid showing content when safety lookups fail.

**Current PWA status:** Source of truth for feed pagination, actor hydration, media hydration, reactions, and safety filtering.

---

## Native Transfer Status

**Status:** `Risky`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Feed/FeedView.swift`
- `VCSMNativeApp/Features/Feed/FeedViewModel.swift`
- `VCSMNativeApp/Features/Feed/FeedRowView.swift`
- `VCSMNativeApp/Services/Feed/LiveFeedService.swift`
- `VCSMNativeApp/Services/Feed/FeedService.swift`

---

## Native Behavior Currently Present

- Native feed, row rendering, view model, paging service, actor summaries, post media, reaction summaries, comment count, and privacy lookup code exist.
- Explore service also lives in `LiveFeedService`.
- Feed now honors the requested page size instead of debug-capping visible results.
- Block/follow visibility enrichment now throws on lookup failure instead of treating failures as empty visibility state.
- Feed block reads select the current `moderation.blocks` shape. That table has no `id`; block identity is the actor/domain pair.

---

## Native Gaps

- Page-size and fail-closed visibility fixes are build-verified, but runtime feed/error UX has not yet been tested against Supabase.
- Needs parity pass for mention maps, reaction viewer state, pull-to-refresh, infinite scroll thresholds, and empty/error states.

---

## Risk Notes

- `LiveFeedService.swift:28-29` sets `visibleTarget` to the resolved requested page size.
- `LiveFeedService.swift:196-219` throws when block/follow safety lookups fail.
- `SupabaseClient.swift` reads active block rows from `moderation.blocks` with `blocker_domain`, `blocker_actor_id`, `blocked_domain`, `blocked_actor_id`, `status`, `reason`, and timestamps only.

---

## Pending Transfer Checklist

- [x] Remove debug/temporary `visibleTarget` caps and honor requested page size.
- [x] Change block/follow safety lookup failure from fail-open to safe empty/error behavior.
- [x] Align block source with PWA `moderation.blocks` or documented backend RPC.
- [x] Remove stale `blocks.id` select from feed visibility reads.
- [ ] Verify actor privacy + follow state before rendering each feed item.
- [ ] Compare native pagination cursor contract to PWA feed pipeline.

---

## PWA → Native Transfer Log

### 2026-05-03 — P0 native transfer start

- Date: 2026-05-03
- Change type: Fix / RLS
- PWA files changed: none — transfer from existing PWA source of truth
- Routes affected: `/feed`, `/posts`
- Screens/components changed: none planned
- Services/DAL changed: `LiveFeedService.swift`, feed block reads in `SupabaseClient.swift`
- Behavior change: honor requested page size and fail closed when block/follow safety lookups fail
- Supabase schema/RPC change: feed block source moves to `moderation.blocks`; follow reads remain `vc.actor_follows`
- RLS expectations changed: yes — blocked/private content must not be shown when safety reads fail
- Affected native modules: Feed, moderation, RLS-compatible access
- Priority: P0
- Native status: Risky — build verified
- Testing notes: `swift build --package-path native/VCSMNativeCore` passed; `xcodebuild -project native/VCSMNativeApp/VCSMNativeApp.xcodeproj -scheme VCSMNativeApp -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` passed. Runtime feed pagination/safety regression not yet run.
- Notes: Implementation now prefers an error over fail-open visibility when block/follow safety reads fail.

### 2026-05-03 — Runtime schema alignment

- Date: 2026-05-03
- Change type: Fix / Schema
- PWA files changed: none — alignment to `_HISTORY/db/snapshots/schema_20260502b.sql`
- Routes affected: `/feed`
- Screens/components changed: none
- Services/DAL changed: `SupabaseClient.swift`, `SafetyReads.dal.swift`
- Behavior change: block visibility reads no longer request `moderation.blocks.id`
- Supabase schema/RPC change: confirmed `moderation.blocks` has no `id`; native reads current block/domain columns
- RLS expectations changed: no — active-actor scoped block reads remain required
- Affected native modules: Feed, Safety, Moderation
- Priority: P0
- Native status: Risky — build verified
- Testing notes: iOS simulator `xcodebuild` passed; static scan found no stale `blocks.id` select. Runtime feed regression not yet run.
- Notes: Addresses screenshot error `column blocks.id does not exist`.

---

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
- Native files updated: `LiveFeedService.swift`, `SupabaseClient.swift`
- Delta status: Risky — page-size cap and fail-open block/follow safety are build-verified; runtime feed parity tests remain open
- Notes: P0 native transfer batch started and build-verified on May 3.

---

## Archived Notes

No archived notes yet.
