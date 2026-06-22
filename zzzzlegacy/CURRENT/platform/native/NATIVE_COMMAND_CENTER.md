# VCSM Native Command Center

## Purpose

This is the single entry point for all VCSM Web/PWA → Native iOS transfer work.

Use this file to track:
- PWA changes made
- Native changes completed
- Native changes pending
- Module status
- Command ownership
- Next implementation batch

---

## Canonical Files

| Purpose | Path |
|---|---|
| Native command center | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/NATIVE_COMMAND_CENTER.md` |
| Monolithic ROADTRIP baseline | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/ROADTRIP.md` |
| Modular transfer index | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md` |
| Module trackers | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/` |
| Architecture contract | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md` |
| Native sync command | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/NATIVE_SYNC_COMMAND.md` |
| Daily sync runner | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/RUN_NATIVE_SYNC.md` |
| Prompt folder | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/prompts/` |
| System rules + prompt guide | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/AGENTS.md` |

---

## Required Read Order

Before native transfer work:

1. Read this file.
2. Read `ARCHITECTURE.md`.
3. Read `ROADTRIP_INDEX.md`.
4. Read affected module file(s).
5. Read `NATIVE_SYNC_COMMAND.md` if syncing from a PWA git diff.

---

## Command Ownership

| Command | Role |
|---|---|
| Robin | Native transfer commander — entry point for all native transfer work |
| Wolverine | Main implementation orchestrator |
| Logan | Documentation sync and drift detection |
| Architect | Structure and dependency audit |
| DB | Supabase schema and query audit |
| Venom | RLS/security/trust-boundary audit |
| Carnage | Migration planning only |
| BugsBunny | Root-cause debug after issue is found |
| Thor | Release/readiness gate |

---

## Native Transfer Workflow

### 1. PWA Change Happens

Record the change in the affected module file:

```
native-transfer/modules/<module>.md
```

Update:
- PWA → Native Transfer Log
- Native Gaps
- Pending Transfer Checklist
- Risk Notes if schema/RLS changed

### 2. Native Transfer Planning

Before editing native code, identify:
- Affected modules
- Affected PWA files
- Affected native files
- Supabase tables/RPCs
- Priority: P0 / P1 / P2

### 3. Native Implementation

Implement only logged work.

Rules:
- P0 first.
- No unrelated edits.
- No file restructuring.
- No rewriting working code.
- No legacy schema paths.
- `actorId` and `kind` only — no `profileId`, `vportId`, or raw `userId` scoping.
- Fail closed on safety, RLS, and moderation checks.

### 4. Native Verification

Record:
- Build/test command
- Pass/fail
- Errors
- Warnings
- Untested areas

### 5. Documentation Update

After native work, update:
- Affected module file (Transfer History date + status)
- `ROADTRIP_INDEX.md` if module status changed
- This file's summary tables

---

## Current Native Transfer Status

| Module | Status | Priority | Source File |
|---|---|---|---|
| Auth / PKCE / session restore | Risky | P0 | native-transfer/modules/auth.md |
| Identity / actor switching | Partial | P1 | native-transfer/modules/identity.md |
| Feed pipeline | Risky | P0 | native-transfer/modules/feed.md |
| Post card | Partial | P1 | native-transfer/modules/post-card.md |
| Post detail / comments / reactions | Partial | P1 | native-transfer/modules/post-detail.md |
| Composer / upload | Risky | P0 | native-transfer/modules/composer-upload.md |
| Notifications / badges | Partial | P1 | native-transfer/modules/notifications.md |
| Explore / search | Partial | P1 | native-transfer/modules/explore-search.md |
| Settings | Risky | P0 | native-transfer/modules/settings.md |
| Social follow / subscribe | Partial | P1 | native-transfer/modules/social-follow.md |
| Moderation / report / block | Risky | P0 | native-transfer/modules/moderation.md |
| Public VPORT profile | Partial | P1 | native-transfer/modules/public-vport-profile.md |
| Public menu | Partial | P1 | native-transfer/modules/public-menu.md |
| Reviews | Partial | P1 | native-transfer/modules/reviews.md |
| Booking / resources | Complete | Watch | native-transfer/modules/booking.md |
| Dashboard routes | Partial | P1 | native-transfer/modules/dashboard-routes.md |
| Wanders | Risky | P1 | native-transfer/modules/wanders.md |
| Chat / inbox | Partial | P1 | native-transfer/modules/chat-inbox.md |
| Schema: vc | Risky | P0 | native-transfer/modules/schema-vc.md |
| Schema: vport | Partial | P0 | native-transfer/modules/schema-vport.md |
| Schema: reviews | Partial | P1 | native-transfer/modules/schema-reviews.md |
| Schema: platform | Partial | P0 | native-transfer/modules/schema-platform.md |
| RLS-compatible access | Risky | P0 | native-transfer/modules/rls-authenticated-access.md |

---

## Changes Made In PWA

Use this table for every meaningful PWA change.

| Date | Module | PWA files changed | Behavior/schema changed | Native impact | Priority | Native status |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

---

## Changes Already Transferred To Native

| Date | Module | Native files changed | What was transferred | Verification | Remaining risk |
|---|---|---|---|---|---|
| 2026-05-03 | Auth | `LiveAuthService.swift`, `SessionStore.swift`, `SupabaseClient.swift` | Reset/recovery PKCE verifier persistence and legal gate fail-closed behavior | `swift build --package-path native/VCSMNativeCore` passed; iOS simulator `xcodebuild` passed | Runtime auth/deep-link/session restore regression not yet run |
| 2026-05-03 | Feed | `LiveFeedService.swift`, `SupabaseClient.swift` | Removed page-size cap; block/follow visibility failures now fail closed; block reads use `moderation.blocks` | `swift build --package-path native/VCSMNativeCore` passed; iOS simulator `xcodebuild` passed | Runtime feed pagination/safety regression not yet run |
| 2026-05-03 | Moderation | `SupabaseClient.swift`, `LiveFeedService.swift` | Block/unblock use `moderation` RPCs; reports use `moderation.reports` / `moderation.report_events` | `swift build --package-path native/VCSMNativeCore` passed; iOS simulator `xcodebuild` passed | Runtime post/profile/chat moderation flows not yet run |
| 2026-05-03 | Settings | `LiveSettingsService.swift`, `SupabaseClient.swift` | Removed direct VPORT delete fallback; `delete_my_vport` failure now surfaces | `swift build --package-path native/VCSMNativeCore` passed; iOS simulator `xcodebuild` passed | Runtime settings/delete regression not yet run |
| 2026-05-03 | Composer / upload | `LivePostComposerService.swift`, `SupabaseClient.swift` | Composer uses shared Cloudflare upload; records `platform.media_assets`; writes back `vc.post_media.media_asset_id` | `swift build --package-path native/VCSMNativeCore` passed; iOS simulator `xcodebuild` passed | Runtime Cloudflare/upload/media asset regression not yet run |
| 2026-05-03 | Runtime schema alignment | `SupabaseClient.swift`, `SupabaseNotificationModels.swift`, `SupabaseSettingsModels.swift`, `SafetyReads.dal.swift`, `SafetyRows.dal.swift`, `ProfileReads.dal.swift`, `ProfileHandleReads.dal.swift`, `NotificationsView.swift`, `LiveFeedService.swift` | Removed native dependencies on retired `vc.actor_presentation`, retired `vc.notifications`, legacy `vc.user_blocks`, and non-existent `moderation.blocks.id`; aligned reads/writes to `identity`, `notification`, and current `moderation` schema surfaces | iOS simulator `xcodebuild` passed; static stale-reference scan passed | Runtime regression on Feed, Explore, Vox/inbox, Notifications, Profile, and Settings screens not yet run |

---

## Pending Native Implementation Queue

| Priority | Module | Task | Native files likely affected | Blocking risk |
|---|---|---|---|---|
| P0 | Auth | Runtime verify PKCE/session restore/legal gate | `LiveAuthService.swift`, `SessionStore.swift` | Login/session launch blocker |
| P0 | Feed | Runtime verify page-size and fail-closed visibility | `LiveFeedService.swift` | Restricted content exposure |
| P0 | Moderation | Runtime verify block/report `moderation` RPC/schema flows | `SupabaseClient.swift`, Safety DAL | Schema/RLS mismatch |
| P0 | Settings | Runtime verify `delete_my_vport` only path | `LiveSettingsService.swift`, `SupabaseClient.swift` | Unsafe delete path |
| P0 | Composer | Runtime verify Cloudflare upload and `platform.media_assets` write-back | `LivePostComposerService.swift`, `CloudflareUploadService.swift` | Upload/schema drift |
| P0 | Runtime schema alignment | Runtime verify screens from 2026-05-03 screenshots: Feed, Explore, Vox/inbox, Notifications, Profile, Settings | `SupabaseClient.swift`, Safety/Profile/Notifications DAL | Launch-screen data blockers if schema drift remains |

---

## Native Files Changed Log

| Date | File | Module | Reason | Verified |
|---|---|---|---|---|
| 2026-05-03 | `VCSMNativeApp/Services/Auth/LiveAuthService.swift` | Auth | PKCE verifier generation/storage and callback exchange fallback | Build verified |
| 2026-05-03 | `VCSMNativeApp/Session/SessionStore.swift` | Auth / RLS | Legal gate fail-closed behavior | Build verified |
| 2026-05-03 | `VCSMNativeApp/Services/Feed/LiveFeedService.swift` | Feed / RLS | Page-size parity and fail-closed block/follow visibility | Build verified |
| 2026-05-03 | `VCSMNativeApp/Services/Supabase/SupabaseClient.swift` | Moderation / Settings / Composer / Auth | Moderation schema/RPC alignment, VPORT RPC-only delete, media asset write-back, reset PKCE request fields | Build verified |
| 2026-05-03 | `VCSMNativeApp/Services/Settings/LiveSettingsService.swift` | Settings | Removed direct VPORT delete fallback | Build verified |
| 2026-05-03 | `VCSMNativeApp/Services/Composer/LivePostComposerService.swift` | Composer / upload | Shared Cloudflare upload and media asset recording | Build verified |
| 2026-05-03 | `VCSMNativeApp/Services/Supabase/SupabaseNotificationModels.swift` | Notifications | Tolerate nullable inbox view booleans while reading `notification.inbox_full_view` | Build verified |
| 2026-05-03 | `VCSMNativeApp/Services/Supabase/SupabaseSettingsModels.swift` | Settings / Search | Decode `identity.search_actor_directory.is_private`; make block `id` optional because `moderation.blocks` has no `id` | Build verified |
| 2026-05-03 | `VCSMNativeApp/Features/Safety/DAL/SafetyReads.dal.swift` | Safety / Moderation | Read active block rows from `moderation.blocks` instead of `vc.user_blocks` | Build verified |
| 2026-05-03 | `VCSMNativeApp/Features/Safety/DAL/SafetyRows.dal.swift` | Safety / Moderation | Make block `id` optional for current `moderation.blocks` shape | Build verified |
| 2026-05-03 | `VCSMNativeApp/Features/Profile/DAL/ProfileReads.dal.swift` | Profile / Search | Hydrate actor cards from `identity.actor_directory` | Build verified |
| 2026-05-03 | `VCSMNativeApp/Features/Profile/DAL/ProfileHandleReads.dal.swift` | Profile / Search | Resolve handles from `identity.actor_directory` | Build verified |
| 2026-05-03 | `VCSMNativeApp/Features/Notifications/NotificationsView.swift` | Notifications / Realtime | Listen to `notification.recipients` realtime changes instead of retired `vc.notifications` | Build verified |

---

## Supabase Schema/RPC Watchlist

| Area | Correct contract | Risk |
|---|---|---|
| Moderation block | `moderation.block_actor` / `moderation.unblock_actor` | Build-verified; runtime RPC flow still needs testing |
| Moderation reports | `moderation.reports` / `moderation.report_events` | Build-verified; runtime report creation/event audit still needs testing |
| VPORT profile | `vport.profiles` | Direct delete fallback removed; broader profile write parity still needs testing |
| Booking | `vport.resources` / `vport.bookings` / `vport.availability_*` / `vport.resource_services` / `vport.service_booking_profiles` | Do not use stale `vc.booking_*` names |
| Media uploads | `platform.media_assets` | Native uploads must record media asset linkage |
| Identity | `vc.actors` + `actor_owners` | `actorId`/`kind` only |

---

## Architecture Gate

Before any native implementation:

- Read `ARCHITECTURE.md`.
- Use `actorId` and `kind` only.
- Never scope behavior by `profileId`, `vportId`, or raw `userId`.
- Owner means Actor Owner through `actor_owners`.
- Build order: DAL → Model → Controller → Hooks → Components → View Screen → Final Screen.
- DAL must use explicit selects. Never use `.select('*')`.
- Screens must not contain business logic.
- Cross-feature access must go through adapters.

---

## Next Recommended Batch

P0 Batch 1 implementation is build-verified. Next work is runtime verification only:
1. Auth reset/deep-link/session restore/legal gate regression
2. Feed pagination + blocked/private visibility regression
3. Post/profile/chat block/report RPC regression
4. Settings VPORT delete RPC regression
5. Composer Cloudflare upload + `platform.media_assets` write-back regression

---

## Do Not Touch Without Approval

- Do not restructure native feature folders.
- Do not rewrite booking, dashboard, chat, public menu, or profile screens broadly.
- Do not enable `NativeFeatureGate.wandersEnabled` until parity is verified.
- Do not edit PWA source code while updating transfer docs.
- Do not change Supabase schema assumptions without DB/contract confirmation.
