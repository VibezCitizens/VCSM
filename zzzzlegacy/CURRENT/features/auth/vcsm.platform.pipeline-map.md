# VCSM Application — Current Runtime Pipeline Map

Generated: 2026-04-06  
Codebase reviewed: `/Users/vcsm/Desktop/VCSM/apps/VCSM`  
Purpose: current-runtime domain map, not a historical migration wish list

## 1. System Overview

VCSM is an actor-first social/business platform with these active schema families:

- `vc.*` — main VCSM domain: posts, profiles, follows, moderation, notifications, vports, booking
- `public.*` — auth-linked profile presentation rows
- `platform.*` — shared identity engine state
- `chat.*` — shared chat engine tables now consumed by the main VCSM chat runtime
- `reviews.*` — shared reviews engine tables (dimensions, reviews, ratings, revisions)
- `wanders.*` — postcard/mailbox subsystem

CURRENT RUNTIME

- identity is platform-first for account/link/preference state, but VCSM still hydrates actors from `vc.*` + `public.*`
- feed/post is still a hybrid feature family with multiple read/write paths
- main chat runtime is engine-backed over `chat.*`
- bell notifications are actor-scoped over `vc.notifications`
- chat unread badge is actor-scoped over `chat.inbox_entries`
- moderation and blocking migrated to neutral `moderation.*` schema (reports, actions, blocks, block_events)

HISTORICAL NOTE

Older versions of this file said VCSM runtime did not yet consume `chat.*`. That is no longer true.


## 2. Current Domain Map

| Domain | Current runtime authority | Primary entrypoints | Core tables / schemas |
| --- | --- | --- | --- |
| Auth | App + Supabase Auth | `LoginScreen.jsx`, register/reset screens | `auth.users`, `public.profiles` |
| Identity | Shared identity engine + VCSM hydrator | `AuthProvider.jsx`, `identityContext.jsx`, `IdentitySwitcher.jsx` | `platform.*`, `vc.actors`, `public.profiles`, `vc.vports` |
| Feed / Post | App-local feature stack | `CentralFeedScreen.jsx`, `UploadScreen.jsx`, `PostDetail.view.jsx` | `vc.posts`, `vc.post_media`, `vc.post_mentions`, `vc.post_comments`, `vc.post_reactions`, `vc.post_rose_gifts` |
| Chat runtime | Shared chat engine consumed by VCSM wrappers | `InboxScreen.jsx`, `ConversationScreen.jsx`, `StartConversationModal.jsx` | `chat.conversations`, `chat.conversation_members`, `chat.messages`, `chat.inbox_entries` |
| Notifications | App-local notifications feature | `NotificationsScreen.jsx`, `BottomNavBar.jsx` | `vc.notifications`, chat badge from `chat.inbox_entries` |
| Profiles / Social | App-local | `ActorProfileScreen.jsx`, profile header/actions | `vc.actors`, `public.profiles`, `vc.vports`, `vc.actor_follows`, `vc.social_follow_requests`, `vc.actor_privacy_settings` |
| Blocking / Moderation | App-local over moderation engine schema | report modal, block actions, moderation covers | `moderation.reports`, `moderation.report_events`, `moderation.actions`, `moderation.blocks`, `moderation.block_events` |
| Reviews | Shared reviews engine (consumed by VCSM app via `features/reviews/setup.js`) | `engines/reviews/` | `reviews.review_dimensions`, `reviews.reviews`, `reviews.review_dimension_ratings`, `reviews.review_revisions` |
| VPORT / Business | App-local | `CreateVportForm.jsx`, VPORT profile screens, dashboards | `vc.vports`, `vc.vport_public_details`, `vc.vport_services`, rates/gas/menu tables |
| Portfolio | Shared portfolio engine | `engines/portfolio/` | `vc.vport_portfolio_items`, `vc.vport_portfolio_media`, `vc.vport_portfolio_tags`, `vc.vport_barber_portfolio_details`, `vc.vport_locksmith_portfolio_details` |
| Locksmith | App-local (locksmith-specific extensions) | Locksmith DALs, hooks, dashboard screen | `vc.vport_locksmith_service_areas`, `vc.vport_locksmith_service_details`, `vc.vport_locksmith_portfolio_details` |
| Booking | App-local | booking controllers, VPORT booking views | `vport.bookings`, `vport.resources`, `vport.availability_rules`, `vport.availability_exceptions`, `vport.service_booking_profiles` |
| Explore / Search | App-local | `ExploreScreen.jsx`, search views | `vc.actor_presentation`, `vc.actors`, `public.profiles`, `vc.vports`, search RPC/read helpers |
| Wanders | App-local subsystem | Wanders screens/controllers | `wanders.cards`, `wanders.mailbox_items`, `wanders.replies`, related support tables |
| Realtime / Events | Mixed | AuthProvider, notifications hooks, chat engine hooks | `vc.notifications`, `chat.inbox_entries`, `chat.messages`, browser events, presence |


## 3. High-Value Pipeline Groups

### Auth and Identity

```text
AuthProvider
  -> IdentityProvider
  -> resolveAuthenticatedContext(appKey='vcsm')
  -> hydrateActor(appKey='vcsm', actorSource='vc')
  -> useIdentity()
```

Primary files:

- `apps/VCSM/src/app/providers/AuthProvider.jsx`
- `apps/VCSM/src/state/identity/identityContext.jsx`
- `apps/VCSM/src/state/identity/identity.controller.js`
- `apps/VCSM/src/features/hydration/vcsmActorHydrator.js`
- `engines/identity/src/controller/resolveAuthenticatedContext.controller.js`

### Feed / Post

```text
CentralFeedScreen / UploadScreen / PostDetail
  -> feature hooks + controllers
  -> app DALs
  -> vc.posts family + moderation/social side reads
```

Primary docs:

- `VCSM_FEED_AND_POST_PIPELINE.md`
- `VCSM_MUTATION_MATRIX.md`

### Chat

```text
InboxScreen / ConversationView / StartConversationModal
  -> VCSM wrapper hooks
  -> @chat
  -> chat.* schema

App-owned seams
  -> actor summaries
  -> realm resolution
  -> block checks
  -> badge UI
  -> moderation/report side effects
```

Primary docs:

- `VCSM_CHAT_RUNTIME_PIPELINE.md`
- `VCSM Chat Badge Pipeline`
- `VCSM Chat Notification Pipeline`
- `VCSM_CHAT_MIGRATION_STATUS.md`

### Notifications

```text
BottomNavBar / Notifications route
  -> bell badge -> vc.notifications
  -> chat badge -> chat.inbox_entries
  -> notifications list -> vc.notifications reader pipeline
```

Primary doc:

- `VCSM_NOTIFICATIONS_PIPELINE.md`

### Profiles / Social / Blocking

```text
ActorProfileScreen
  -> useProfileView / useProfileGate
  -> follow/privacy/block hooks
  -> vc actor/profile/follow/privacy/block tables
```

Primary docs:

- `VCSM_PROFILES_AND_SOCIAL_PIPELINE.md`
- `VCSM Subscribe Pipeline`
- `VCSM_MODERATION_AND_BLOCK_PIPELINE.md`

### VPORT / Booking

```text
CreateVportForm / VPORT profile / dashboards
  -> VPORT controllers + DALs
  -> booking controllers + DALs
  -> vc.vports / services / menu / reviews / gas / rates / bookings
```

Primary doc:

- `VCSM_VPORT_BUSINESS_PIPELINE.md`


## 4. Realtime Map

CURRENT RUNTIME

| Realtime concern | Current source |
| --- | --- |
| Auth/session changes | `supabase.auth.onAuthStateChange` in `AuthProvider.jsx` |
| Bell notification badge | realtime on `vc.notifications` |
| Chat unread badge | realtime on `chat.inbox_entries` |
| Main conversation timeline | engine-backed chat realtime on `chat.messages` |
| Main inbox list | engine-backed chat realtime on `chat.inbox_entries` |
| Typing | presence channels via engine typing hook |
| Cross-feature refresh nudges | browser events such as `noti:refresh`, `noti:reload`, `actor:changed` |

HISTORICAL NOTE

Local realtime helpers for `vc.inbox_entries` and `vc.messages` still exist under `features/chat/**`, but I did not verify them as active imports in the main wrapper-hook runtime.


## 5. Major Corrections From Older Versions

OUTDATED CLAIM CORRECTED

- VCSM runtime **does** consume `chat.*` now for the main chat flow.

OUTDATED CLAIM CORRECTED

- chat unread badge is **not** sourced from `vc.inbox_entries` anymore; it reads `chat.inbox_entries`.

OUTDATED CLAIM CORRECTED

- the pipeline map should not treat every file present in the repo as an active runtime pipeline. Some legacy chat files are still present but no longer drive the main screens.

OUTDATED CLAIM CORRECTED

- “fully migrated” and “legacy-only” labels need to distinguish:
  - current runtime
  - code still present on disk
  - future cleanup target


## 6. Recommended Companion Docs

Use these for the authoritative current-runtime details:

- `VCSM_AUTH_AND_IDENTITY_PIPELINE.md`
- `VCSM_CHAT_RUNTIME_PIPELINE.md`
- `VCSM_FEED_AND_POST_PIPELINE.md`
- `VCSM_NOTIFICATIONS_PIPELINE.md`
- `VCSM_PROFILES_AND_SOCIAL_PIPELINE.md`
- `VCSM_MODERATION_AND_BLOCK_PIPELINE.md`
- `VCSM_VPORT_BUSINESS_PIPELINE.md`
- `VCSM_MUTATION_MATRIX.md`
