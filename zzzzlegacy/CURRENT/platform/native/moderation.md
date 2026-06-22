# Module: Moderation / report / block flows

## PWA Source of Truth

**Routes:** Integrated into post, profile, chat, settings privacy

**Screens/components:**
- `apps/VCSM/src/features/moderation/*`
- `apps/VCSM/src/features/block/*`
- `apps/VCSM/src/shared/components/ActorActionsMenu*`

**Services/DAL:**
- `apps/VCSM/src/features/block/dal/block.write.dal.js`
- `apps/VCSM/src/features/moderation/dal/reports.dal.js`
- `apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js`

**Supabase schema/tables/RPCs:**
- PWA block write: `moderation.block_actor` / `moderation.unblock_actor` RPCs
- PWA report write: `moderation.reports` / `moderation.report_events`
- Native P0 scoped path now reads/writes `moderation` schema/RPCs; historical drift was `vc.user_blocks` and `vc.reports`/`vc.report_events`

**RLS expectations:** Moderation writes must go through `SECURITY DEFINER` RPC/schema paths where PWA does; client must not bypass moderation RLS or fail open.

**Current PWA status:** Source of truth uses `moderation` schema/RPCs for all block/report flows.

---

## Native Transfer Status

**Status:** `Risky`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Safety/*`
- `VCSMNativeApp/Features/Chat/DAL/ChatModeration.dal.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Features/Safety/DAL/SafetyReads.dal.swift`

---

## Native Behavior Currently Present

- Native safety module includes visibility guards, blocked/reported cover cards, hide/unhide controllers, and report/block service calls.
- Chat moderation controllers exist for reporting conversations/messages and spam cover state.
- Block/unblock writes now call `moderation.block_actor` / `moderation.unblock_actor`.
- Report writes now target `moderation.reports` and `moderation.report_events`.
- Block reads now target active rows in `moderation.blocks`.
- Block reads now use the current composite block identity fields; `moderation.blocks` has no `id`.

---

## Native Gaps

- Native block/report DAL is build-verified against the `moderation` RPC/schema path, but live RPC/table behavior is not yet tested.
- Cover overlays, hide actions, unblock side effects, and conversation cover behavior not verified.

---

## Risk Notes

- `SupabaseClient.swift:1580-1609` uses `moderation.block_actor` / `moderation.unblock_actor`.
- `SupabaseClient.swift` reads active rows from `moderation.blocks` using domain/actor columns, status, reason, and timestamps.
- `SafetyReads.dal.swift` now reads `moderation.blocks` instead of legacy `vc.user_blocks`.
- `SupabaseClient.swift:2714-2788` writes post reports to `moderation.reports` / `moderation.report_events`.
- `SupabaseClient.swift:2802-2862` writes chat reports to `moderation.reports` / `moderation.report_events`.
- Chat has App Store moderation implications; report/block/cover flow must work before launch.

---

## Pending Transfer Checklist

- [x] Replace native block/unblock writes with `moderation` RPC path or document confirmed backend equivalence.
- [x] Replace native report writes with `moderation` schema path or document confirmed backend equivalence.
- [x] Make feed/profile/chat safety reads fail closed — never show blocked content on lookup errors.
- [x] Remove stale `vc.user_blocks` / `blocks.id` read assumptions from native safety reads.
- [ ] Test report/block from post card, post detail, profile, and chat.

---

## PWA → Native Transfer Log

### 2026-05-03 — P0 native transfer start

- Date: 2026-05-03
- Change type: Fix / Schema / RLS
- PWA files changed: none — transfer from existing PWA source of truth
- Routes affected: post, profile, settings privacy, chat report/block surfaces
- Screens/components changed: none planned
- Services/DAL changed: scoped moderation methods in `SupabaseClient.swift`
- Behavior change: replace native block/unblock writes with moderation RPCs and report writes with moderation schema tables
- Supabase schema/RPC change: `moderation.block_actor`, `moderation.unblock_actor`, `moderation.blocks`, `moderation.reports`, `moderation.report_events`
- RLS expectations changed: yes — client writes must follow canonical moderation schema/RPC paths
- Affected native modules: Moderation, Feed, Settings, schema-vc
- Priority: P0
- Native status: Risky — build verified
- Testing notes: `swift build --package-path native/VCSMNativeCore` passed; `xcodebuild -project native/VCSMNativeApp/VCSMNativeApp.xcodeproj -scheme VCSMNativeApp -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` passed. Runtime moderation RPC/write tests not yet run.
- Notes: Build-verified implementation does not write `vc.user_blocks`, `vc.reports`, or `vc.report_events` in the scoped native service path.

### 2026-05-03 — Runtime schema alignment

- Date: 2026-05-03
- Change type: Fix / Schema / RLS
- PWA files changed: none — alignment to `_HISTORY/db/snapshots/schema_20260502b.sql`
- Routes affected: feed, profile, settings privacy, chat safety surfaces
- Screens/components changed: none
- Services/DAL changed: `SupabaseClient.swift`, `SafetyReads.dal.swift`, `SafetyRows.dal.swift`, `SupabaseSettingsModels.swift`
- Behavior change: all scoped native block reads use current `moderation.blocks` columns and no longer depend on a synthetic table `id`
- Supabase schema/RPC change: confirmed `moderation.blocks` composite identity fields
- RLS expectations changed: no — reads remain active-actor scoped and must fail closed in visibility flows
- Affected native modules: Moderation, Feed, Settings, Safety
- Priority: P0
- Native status: Risky — build verified
- Testing notes: iOS simulator `xcodebuild` passed; static scan found no stale `vc.user_blocks` or `blocks.id` reads. Runtime moderation regression not yet run.
- Notes: Addresses screenshot error `column blocks.id does not exist`.

### 2026-05-04 — Moderation actions schema fix (vc.moderation_actions → moderation.actions)

- Date: 2026-05-04
- Change type: Fix / Schema
- PWA files changed: none
- Routes affected: post hide/unhide, comment hide/unhide, content visibility
- Screens/components changed: none
- Services/DAL changed: `SafetyRows.dal.swift`, `SafetyReads.dal.swift`, `SafetyWrites.dal.swift`, `SupabaseConversationModels.swift`, `SupabaseClient.swift`, `ContentVisibility.model.swift`, `LoadContentVisibility.controller.swift`, `HidePostForActor.controller.swift`, `HideCommentForActor.controller.swift`, `UnhidePostForActor.controller.swift`, `UnhideCommentForActor.controller.swift`, `LivePostService.swift`, `ChatModeration.dal.swift`
- Behavior change: All moderation action reads/writes now use `moderation.actions` (schema: `moderation`, table: `actions`). Column names changed from `object_type`/`object_id` to `target_type`/`target_id`. Insert payloads now include required `actor_domain`/`target_domain` fields.
- Supabase schema/RPC change: `vc.moderation_actions` → `moderation.actions`
- RLS expectations changed: no — same owner-scoped access pattern
- Affected native modules: Moderation, Feed, Chat, Safety
- Priority: P0
- Native status: Risky — build verified
- Testing notes: Xcode diagnostics clean on all 12 edited files. Runtime testing pending.
- Notes: Fixes runtime error `relation "vc.moderation_actions" does not exist`. Also renamed helper `makeHiddenObjectIDs` → `makeHiddenTargetIDs` for consistency.

---

## Transfer History

- Last synced date: 2026-05-04
- Native files updated: 12 files — `SafetyRows.dal.swift`, `SafetyReads.dal.swift`, `SafetyWrites.dal.swift`, `SupabaseConversationModels.swift`, `SupabaseClient.swift`, `ContentVisibility.model.swift`, `LoadContentVisibility.controller.swift`, `HidePostForActor.controller.swift`, `HideCommentForActor.controller.swift`, `UnhidePostForActor.controller.swift`, `UnhideCommentForActor.controller.swift`, `LivePostService.swift`, `ChatModeration.dal.swift`
- Delta status: Risky — all moderation schema paths now aligned (blocks, reports, actions); runtime testing remains
- Notes: Three separate schema fixes now complete: (1) block reads → `moderation.blocks`, (2) report writes → `moderation.reports`/`moderation.report_events`, (3) action reads/writes → `moderation.actions` with `target_type`/`target_id`/`actor_domain`/`target_domain`.

### Previous entries

- Synced: 2026-05-03
- Delta: Risky — moderation schema/RPC alignment build-verified
- Notes: P0 native transfer batch started and build-verified on May 3.

---

## Archived Notes

No archived notes yet.
