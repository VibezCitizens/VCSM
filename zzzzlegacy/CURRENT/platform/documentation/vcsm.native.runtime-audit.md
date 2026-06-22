# VCSM Native Current Runtime Audit

## 1. Purpose of this document
This document describes the CURRENT RUNTIME of the native iOS project as it exists today and compares it against the CURRENT RUNTIME of the web VCSM app in [apps/VCSM](/Users/vcsm/Desktop/VCSM/apps/VCSM). It is not a target-state migration guide. It distinguishes:

- what web VCSM actually does today
- what the native app actually does today
- where parity exists
- where native is partial
- where native diverges from web architecture

## 2. Source systems reviewed
Primary web source system:
- [apps/VCSM/src/main.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/main.jsx)
- [apps/VCSM/src/app/routes/index.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/app/routes/index.jsx)
- [apps/VCSM/src/app/providers/AuthProvider.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/app/providers/AuthProvider.jsx)
- [apps/VCSM/src/state/identity/identityContext.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/state/identity/identityContext.jsx)
- [apps/VCSM/src/state/identity/identity.controller.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/state/identity/identity.controller.js)
- [apps/VCSM/src/features/feed/hooks/useFeed.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/feed/hooks/useFeed.js)
- [apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js)
- [apps/VCSM/src/features/chat/setup.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/setup.js)
- [apps/VCSM/src/features/chat/inbox/hooks/useInbox.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/inbox/hooks/useInbox.js)
- [apps/VCSM/src/features/notifications/screen/views/NotificationsScreenView.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/notifications/screen/views/NotificationsScreenView.jsx)
- [apps/VCSM/src/features/notifications/inbox/hooks/useNotifications.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/notifications/inbox/hooks/useNotifications.js)
- [apps/VCSM/src/features/notifications/inbox/hooks/useNotificationsHeader.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/notifications/inbox/hooks/useNotificationsHeader.js)
- [apps/VCSM/src/features/upload/hooks/useUploadSubmit.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/upload/hooks/useUploadSubmit.js)
- [apps/VCSM/src/features/post/screens/PostDetail.view.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/post/screens/PostDetail.view.jsx)
- [apps/VCSM/src/features/post/commentcard/hooks/useCommentThread.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/post/commentcard/hooks/useCommentThread.js)
- [apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx)
- [apps/VCSM/src/features/settings/screen/SettingsScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/settings/screen/SettingsScreen.jsx)
- [apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuView.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuView.jsx)
- [apps/VCSM/src/features/wanders/screens/WandersHome.screen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/wanders/screens/WandersHome.screen.jsx)

Native runtime reviewed:
- [native/VCSMNativeApp/VCSMNativeApp/App/VCSMNativeApp.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/App/VCSMNativeApp.swift)
- [native/VCSMNativeApp/VCSMNativeApp/App/AppRootView.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/App/AppRootView.swift)
- [native/VCSMNativeApp/VCSMNativeApp/App/AppContainer.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/App/AppContainer.swift)
- [native/VCSMNativeApp/VCSMNativeApp/App/AppNavigationView.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/App/AppNavigationView.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Session/SessionStore.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Session/SessionStore.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Auth/LiveAuthService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Auth/LiveAuthService.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Supabase/SupabaseClient.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Supabase/SupabaseClient.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Feed/FeedViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Feed/FeedViewModel.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Feed/LiveFeedService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Feed/LiveFeedService.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Inbox/InboxView.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Inbox/InboxView.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Inbox/InboxViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Inbox/InboxViewModel.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Conversation/ConversationViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Conversation/ConversationViewModel.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Conversation/LiveConversationService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Conversation/LiveConversationService.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Notifications/NotificationsView.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Notifications/NotificationsView.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Notifications/NotificationsViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Notifications/NotificationsViewModel.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Notifications/LiveNotificationsService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Notifications/LiveNotificationsService.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Composer/CreatePostViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Composer/CreatePostViewModel.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Composer/LivePostComposerService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Composer/LivePostComposerService.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/PostDetail/PostDetailViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/PostDetail/PostDetailViewModel.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Post/LivePostService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Post/LivePostService.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Profile/ProfileViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Profile/ProfileViewModel.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Profile/LiveProfileService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Profile/LiveProfileService.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Settings/SettingsViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Settings/SettingsViewModel.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Services/Settings/LiveSettingsService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Settings/LiveSettingsService.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuScreen.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuScreen.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Booking/Screens/VPortBookingScreen.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Booking/Screens/VPortBookingScreen.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Dashboard/Screens/OwnerDashboardScreen.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Dashboard/Screens/OwnerDashboardScreen.swift)
- [native/VCSMNativeApp/VCSMNativeApp/Features/Wanders/Screens/WandersHomeScreen.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Wanders/Screens/WandersHomeScreen.swift)
- [native/VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift)
- [native/VCSMNativeCore/Sources/VCSMNativeCore/AuthSession.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeCore/Sources/VCSMNativeCore/AuthSession.swift)
- [native/VCSMNativeCore/Sources/VCSMNativeCore/ActorIdentity.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeCore/Sources/VCSMNativeCore/ActorIdentity.swift)

Supporting notes consulted:
- [VCSM_FEED_AND_POST_PIPELINE.md](/Users/vcsm/Desktop/VCSM/logan/VCSM_FEED_AND_POST_PIPELINE.md)
- [VCSM_NOTIFICATIONS_PIPELINE.md](/Users/vcsm/Desktop/VCSM/logan/VCSM_NOTIFICATIONS_PIPELINE.md)
- [VCSM_CHAT_RUNTIME_PIPELINE.md](/Users/vcsm/Desktop/VCSM/logan/VCSM_CHAT_RUNTIME_PIPELINE.md)
- [VCSM_AUTH_AND_IDENTITY_PIPELINE.md](/Users/vcsm/Desktop/VCSM/logan/VCSM_AUTH_AND_IDENTITY_PIPELINE.md)
- [native_ios.md](/Users/vcsm/Desktop/VCSM/logan/native_ios.md)

## 3. Current web VCSM runtime map
| System | Current web runtime | Key files |
| --- | --- | --- |
| Bootstrap and providers | Vite SPA. `main.jsx` configures shared identity, hydration, and chat engines before rendering `AuthProvider -> IdentityProvider -> App -> routes`. | [main.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/main.jsx), [App.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/App.jsx) |
| Auth and session | Supabase auth session is hydrated in `AuthProvider`; login form submits through controller/DAL; route navigation can happen before identity resolution finishes. | [AuthProvider.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/app/providers/AuthProvider.jsx), [useLogin.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/auth/hooks/useLogin.js), [login.controller.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/auth/controllers/login.controller.js) |
| Onboarding | Web uses dedicated onboarding screen and hook to complete profile fields after auth. | [Onboarding.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/auth/screens/Onboarding.jsx) |
| Identity and actor switching | Web identity is actor-first and engine-backed. `IdentityProvider` resolves authenticated context through `@identity`, hydrates through `@hydration`, and uses platform preference writes for actor switching. | [identityContext.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/state/identity/identityContext.jsx), [identity.controller.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/state/identity/identity.controller.js), [features/identity/setup.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/identity/setup.js) |
| Feed | Web feed is a multi-step client pipeline using `viewerActorId`, realm, pagination drain, visibility filtering, actor enrichment, and media/mentions hydration. | [useFeed.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/feed/hooks/useFeed.js), [fetchFeedPage.pipeline.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js) |
| Chat/inbox/conversation | Web chat runtime is currently engine-backed through `@chat`. Inbox reads, member resolution, and most conversation flows delegate to shared engine wiring configured in app setup. | [features/chat/setup.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/setup.js), [useInbox.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/inbox/hooks/useInbox.js), [ConversationScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/conversation/screen/ConversationScreen.jsx) |
| Notifications | Web bell notifications are actor-scoped and loaded from `vc.notifications`; header count and mark-all-seen are separate hook/controller paths; badge refresh uses events and polling. | [NotificationsScreenView.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/notifications/screen/views/NotificationsScreenView.jsx), [useNotifications.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/notifications/inbox/hooks/useNotifications.js), [useNotificationsHeader.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/notifications/inbox/hooks/useNotificationsHeader.js), [BottomNavBar.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/shared/components/BottomNavBar.jsx) |
| Composer/post detail/comments | Web post creation uploads media first, then creates post, media rows, and mentions. Post detail assembles post, comments, reactions, reporting, editing, and deletion from many local hooks/controllers. | [UploadScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/upload/screens/UploadScreen.jsx), [useUploadSubmit.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/upload/hooks/useUploadSubmit.js), [PostDetail.view.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/post/screens/PostDetail.view.jsx), [useCommentThread.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/post/commentcard/hooks/useCommentThread.js) |
| Profiles, settings, VPORTs | Web has actor-kind-aware profile routing, lazy settings tabs, public VPORT menu, business dashboards, booking, gas, Wanders, and professional surfaces. | [ActorProfileScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx), [SettingsScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/settings/screen/SettingsScreen.jsx), [VportPublicMenuView.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuView.jsx), [WandersHome.screen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/wanders/screens/WandersHome.screen.jsx) |

## 4. Current native app runtime map
| System | Current native runtime |
| --- | --- |
| App shell | SwiftUI app with `AppContainer`, `SessionStore`, `AppRootView`, and `AppNavigationView`. |
| Session/auth | Live auth against Supabase auth endpoints with keychain-backed session persistence. |
| Identity | Stored in `AuthSession.activeIdentity`; resolved via native Supabase client helpers, not shared web engines. |
| Feed | Implemented with `FeedViewModel` + `LiveFeedService`; strong feed parity, native UI. |
| Inbox/conversation | Implemented with `InboxViewModel`, `ConversationViewModel`, `LiveInboxService`, `LiveConversationService`, and realtime/polling helpers. |
| Notifications | Implemented with `NotificationsViewModel` + `LiveNotificationsService`; filter chips, mark-all-seen/read. |
| Composer/post detail | Implemented with `CreatePostViewModel` + `LivePostComposerService` and `PostDetailViewModel` + `LivePostService`. |
| Profiles/settings | Implemented with profile/settings view models and services; includes profile editing, privacy, block, follow-request actions, VPORT creation, and identity switching. |
| VPORT/public/business | Native has public menu, booking, owner dashboard/settings, gas, flyer/editor routes, and management screens. |
| Wanders | Native has Wanders home/create/claim/card/deep-link surfaces and native DAL/store. |
| Explore | Native tab and service exist in app container and navigation. |

## 5. Bootstrap and app container
CURRENT WEB RUNTIME:
- Web bootstrap happens in [main.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/main.jsx).
- It configures `@identity`, `@hydration`, and `@chat` before any render.
- Providers are React-level and route resolution is BrowserRouter-driven.

CURRENT NATIVE RUNTIME:
- Native bootstrap happens in [VCSMNativeApp.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/App/VCSMNativeApp.swift).
- `AppContainer.live()` wires the real runtime dependencies in [AppContainer.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/App/AppContainer.swift):
  - `SupabaseClient`
  - `LiveAuthService`
  - `LiveFeedService`
  - `LiveExploreService`
  - `LiveInboxService`
  - `LiveConversationService`
  - `LiveNotificationsService`
  - `LivePostService`
  - `LiveProfileService`
  - `LivePostComposerService`
  - `LiveSettingsService`
  - `LivePushNotificationService`
- `AppRootView` drives bootstrap state and deep-link entry.
- `AppNavigationView` owns native tab selection and per-tab navigation stacks.

PARITY GAP:
- Native does not bootstrap the web shared engines directly.
- Native runtime is service-container-based, not engine-container-based.
- This is a real implementation, not a shell, but it is architecturally different from web bootstrap.

## 6. Session and auth runtime
CURRENT WEB RUNTIME:
- `AuthProvider` hydrates session with `supabase.auth.getSession()`, subscribes to `onAuthStateChange`, and exposes `user`, `session`, `loading`, `logout`.
- Login uses [useLogin.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/auth/hooks/useLogin.js) and [login.controller.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/auth/controllers/login.controller.js).
- Web login redirects before identity fully settles.

CURRENT NATIVE RUNTIME:
- `SessionStore` is the runtime owner of session/bootstrap state in [SessionStore.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Session/SessionStore.swift).
- `LiveAuthService` in [LiveAuthService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Auth/LiveAuthService.swift) handles:
  - restore from keychain
  - refresh token fallback
  - sign in
  - registration
  - reset email
  - onboarding completion
  - sign out
- Native keeps auth and active identity together in [AuthSession.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeCore/Sources/VCSMNativeCore/AuthSession.swift).

PARITY GAP:
- Native auth is IMPLEMENTED_DIFFERENTLY.
- Native has stronger session encapsulation than web, but it does not mirror web provider/event semantics.
- Web uses auth provider + identity provider; native collapses that into `SessionStore` + `LiveAuthService`.

## 7. Identity runtime
CURRENT WEB RUNTIME:
- Web identity is engine-backed through `@identity` and hydrated through `@hydration`.
- `loadDefaultIdentityForUser()` in [identity.controller.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/state/identity/identity.controller.js) resolves app/account/actor context, selects an active actor, reads `vc.actors`, and hydrates actor details.
- `switchActor()` in [identityContext.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/state/identity/identityContext.jsx) writes platform preference state through `engineSwitchActiveActor(...)` and then rehydrates domain data.

CURRENT NATIVE RUNTIME:
- Native identity is PARTIALLY_IMPLEMENTED.
- `AuthSession.activeIdentity` is the only active-actor container.
- `LiveAuthService.resolvedIdentity(...)` falls back to:
  - `fetchPrimaryIdentity(userID:accessToken:)`
  - then `fetchActorByProfile(...)`
  - then `fetchProfileShell(...)`
- `SupabaseClient.fetchPrimaryIdentity(...)` currently reads `vc.actors` for `kind=user` by `profile_id = userID`, then reads `public.profiles`.
- `LiveSettingsService.switchActiveIdentity(...)` changes identity by returning `session.withActiveIdentity(...)`; it does not write platform actor preference state.

PARITY GAP:
- This is the largest current drift.
- Native does NOT currently use:
  - `@identity`
  - `@hydration`
  - app-specific hydrator adapters
  - platform-backed actor switching
- Web supports persistent engine-driven multi-actor resolution. Native currently resolves identity directly from domain tables and stores the selected identity locally in session state.
- Impact: actor switching, active-actor persistence, and future multi-actor correctness can drift from web behavior.

## 8. Feed runtime
CURRENT WEB RUNTIME:
- `CentralFeedScreen` passes `identity.actorId` and `realmId` into [useFeed.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/feed/hooks/useFeed.js).
- `useFeed` drains up to three pages, fetches viewer context, enriches actors, filters for privacy/block/vport activity, and preloads initial media.
- `fetchFeedPage.pipeline.js` fans out to post/media/mentions/blocks/follows/actors bundle reads.

CURRENT NATIVE RUNTIME:
- Native feed is IMPLEMENTED_DIFFERENTLY with strong functional parity.
- `FeedViewModel` in [FeedViewModel.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Feed/FeedViewModel.swift) owns:
  - initial load
  - refresh
  - pagination
  - local follow state
  - local reaction state
  - local hide/remove actions
- `LiveFeedService` in [LiveFeedService.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Services/Feed/LiveFeedService.swift) reproduces the web drain/filter pattern:
  - resolve viewer actor
  - fetch page rows
  - fetch media, hidden posts, actor bundle, block rows, follow rows, reactions, comment counts
  - optionally fetch mentions
  - filter blocked/private/inactive actors
  - build `FeedItem`

PARITY GAP:
- Native feed parity is relatively strong.
- Native does not reuse web feed hooks/models directly; it reimplements the behavior in Swift.
- Identity weakness upstream still affects feed correctness because feed resolves viewer actor from `AuthSession.activeIdentity` or `fetchPrimaryIdentity(...)`.

## 9. Chat, inbox, and conversation runtime
CURRENT WEB RUNTIME:
- Web chat is engine-backed via [features/chat/setup.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/setup.js).
- Inbox reads delegate to `@chat` in [useInbox.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/inbox/hooks/useInbox.js).
- Conversation screens are route wrappers over deeper engine-backed hooks and controller flows.

CURRENT NATIVE RUNTIME:
- Native chat is IMPLEMENTED_DIFFERENTLY.
- Inbox:
  - `InboxViewModel` loads folders, opens threads, moves threads, and polls.
  - `InboxView` starts `InboxRealtimeStore` and also refreshes by user action.
  - `LiveInboxService` reads inbox rows, unread counts, search results, and opens direct conversations.
- Conversation:
  - `ConversationViewModel` loads messages, sends, edits, unsends, deletes-for-me, reports, and polls every 4 seconds.
  - `LiveConversationService` fetches messages, hides deleted messages locally, marks read, sends text/image messages, edits, unsends, hides-for-actor, and reports.

PARITY GAP:
- Native does not use `@chat`.
- Web chat writes are centralized behind shared engine behavior. Native chat currently performs direct Supabase client writes and explicit inbox-entry upkeep in Swift.
- That creates a real authority drift:
  - web chat runtime: engine-backed
  - native chat runtime: app-local service-backed
- Native inbox has realtime observation via [useInboxRealtime.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp/VCSMNativeApp/Features/Chat/Hooks/useInboxRealtime.swift), but conversation refresh is still polling-based.

## 10. Notifications runtime
CURRENT WEB RUNTIME:
- `NotificationsScreenView` uses identity actor id to load list and header count.
- `useNotifications` reloads on `noti:reload`.
- `useNotificationsHeader` loads unread count and marks all seen.
- Bottom-nav notification badge polls separately.

CURRENT NATIVE RUNTIME:
- Native notifications are IMPLEMENTED_DIFFERENTLY.
- `NotificationsViewModel` loads the list, filters by follow/reaction/comment/mention, computes unread count, marks all seen, and handles follow-request responses.
- `LiveNotificationsService`:
  - loads notifications for `recipientActorID`
  - resolves sender display data through actor bundle reads
  - auto-marks unseen rows as seen on fetch
  - supports mark-all-read
- `NotificationsView` presents chips, list, empty state, and follow-request actions.

PARITY GAP:
- Native covers the main list behavior and read-state writes.
- I did not find a native realtime notifications subscription comparable to inbox realtime.
- Native notification badge count in `AppNavigationView` is derived from loaded notifications view-model state, not a separate realtime bell pipeline like web.

## 11. Composer and post-detail runtime
CURRENT WEB RUNTIME:
- Post creation is split between upload helpers and controllers:
  - [UploadScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/upload/screens/UploadScreen.jsx)
  - [useUploadSubmit.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/upload/hooks/useUploadSubmit.js)
- Post detail is assembled from many hooks in [PostDetail.view.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/post/screens/PostDetail.view.jsx).
- Comments are loaded and mutated through [useCommentThread.js](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/post/commentcard/hooks/useCommentThread.js) and related controllers.

CURRENT NATIVE RUNTIME:
- Composer is IMPLEMENTED_DIFFERENTLY and already substantial.
- `CreatePostViewModel` supports:
  - caption
  - location text
  - mode selection
  - media selection
  - mention extraction and typeahead
  - submit lifecycle
- `LivePostComposerService` supports:
  - media normalization
  - R2 upload
  - `vc.posts` insert
  - `vc.post_media` insert
  - mention resolution and `vc.post_mentions` insert
  - rollback by deleting the post if media row persistence fails
- Post detail is also substantial:
  - `PostDetailViewModel` loads post detail and supports reactions, roses, comments, comment likes, edit, delete, and reporting.
  - `LivePostService` fetches detail, comments, reactions, mentions, and applies mutations against Supabase.

PARITY GAP:
- Native coverage is strong here.
- The mutation path is not engine-backed and not identical to web controller layering.
- Native keeps mention syncing best-effort during post edit, matching web behavior rather than hardening it.

## 12. Profile, settings, and VPORT runtime
CURRENT WEB RUNTIME:
- Web profiles are actor-kind-aware through [ActorProfileScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx).
- Settings use lazy tabs in [SettingsScreen.jsx](/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/settings/screen/SettingsScreen.jsx).
- Public VPORT menu, booking, gas, dashboard, and Wanders all exist as separate feature surfaces.

CURRENT NATIVE RUNTIME:
- Native profile/settings/VPORT coverage is broader than a shell.
- Profile:
  - `ProfileViewModel` + `LiveProfileService`
  - profile details + actor posts loading
  - profile-handle resolution and top-friends editor files exist
- Settings:
  - `SettingsViewModel` + `LiveSettingsService`
  - privacy updates
  - block/unblock
  - pending follow-request responses
  - editable profile save
  - create/delete VPORT
  - delete account
  - identity switching
- VPORT/business/public:
  - public menu screens
  - public flyer screens
  - booking screens
  - owner dashboard/settings/reviews/calendar
  - gas prices screens
  - VPORT management surfaces
- Wanders:
  - native home, create, claim, detail, and deep-link screens

PARITY GAP:
- Native is much richer than the earlier `native_ios.md` shell description implied.
- The main drift is not feature absence; it is authority drift.
- VPORT identity switching and actor ownership are handled through native service logic, not web engine contracts.

## 13. Data/services layer
CURRENT WEB RUNTIME:
- Web is feature-layered: DAL -> controller -> hook -> screen, with shared engines for identity/chat/hydration.
- Supabase access is distributed across many feature DAL files.

CURRENT NATIVE RUNTIME:
- Native uses a different layering pattern:
  - `AppContainer`
  - service protocols
  - live service implementations
  - a large `SupabaseClient`
  - some feature-local controller/DAL folders for business surfaces like Booking, Dashboard, and Wanders
- `VCSMNativeCore` contains shared value types and route enums, not network logic.

PARITY GAP:
- Native does not mirror the web feature-DAL/engine split one-to-one.
- `SupabaseClient` is a central authority in native for many domains, which is convenient today but creates a monolith risk as parity grows.

## 14. Realtime, push, and event handling
CURRENT WEB RUNTIME:
- Web uses:
  - service worker registration in production
  - Supabase realtime through the chat engine
  - notification badge refresh events and polling
  - route-driven reload events

CURRENT NATIVE RUNTIME:
- Native push is real:
  - `LivePushNotificationService` requests APNs permission and registers device tokens server-side through `pushRegisterTokenDAL`.
- Native inbox realtime is real:
  - `InboxRealtimeStore` creates a `ChatRealtimeObservation`.
  - `AppNavigationView` uses realtime + 20-second polling for inbox badge.
- Native conversation messages are still polling-based via `ConversationViewModel.startPolling`.
- Native notifications appear list-driven, not realtime-driven.

PARITY GAP:
- Native has real push token registration but not a fully documented push-open routing pipeline yet.
- Native chat realtime is narrower than the web engine model.
- Native has no visible feed realtime path.

## 15. What lives in shared native core vs app target
In [VCSMNativeCore](/Users/vcsm/Documents/New%20project/native/VCSMNativeCore):
- shared route enum: [NativeAppRoute.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift)
- shared session/identity models: [AuthSession.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeCore/Sources/VCSMNativeCore/AuthSession.swift), [ActorIdentity.swift](/Users/vcsm/Documents/New%20project/native/VCSMNativeCore/Sources/VCSMNativeCore/ActorIdentity.swift)
- shared feature value models: feed, inbox, notifications, post detail, profile, settings, dashboard, VPORT, onboarding, explore, booking, Wanders-related types

In the app target [VCSMNativeApp](/Users/vcsm/Documents/New%20project/native/VCSMNativeApp):
- SwiftUI views and screens
- view models
- live services
- Supabase networking
- keychain persistence
- push token handling
- feature-local controllers/DALs for selected native-only structures

Important current-runtime fact:
- Native core is a shared model/package layer.
- It is not the web engine layer transplanted into iOS.

## 16. Web-to-native parity matrix
| System | Web current runtime | Native coverage | Native current runtime | Parity gap |
| --- | --- | --- | --- | --- |
| Bootstrap/navigation | React providers + BrowserRouter + engine setup | IMPLEMENTED_DIFFERENTLY | SwiftUI `AppRootView`, `AppNavigationView`, `AppContainer` | Same product shell idea, different runtime architecture |
| Session/auth | Supabase auth in `AuthProvider` + login hook/controller | IMPLEMENTED_DIFFERENTLY | `SessionStore` + `LiveAuthService` + keychain | Native is cleaner in one place, but not provider/engine based |
| Onboarding | Dedicated onboarding screen and hooks | IMPLEMENTED_DIFFERENTLY | `SessionStore` gate + `OnboardingView` + `LiveAuthService.completeOnboarding` | Comparable flow, different orchestration |
| Identity | Engine-backed, hydrated, persistent active actor | PARTIALLY_IMPLEMENTED | `AuthSession.activeIdentity` + native lookup helpers | No shared identity engine or hydration engine; actor switch not platform-authoritative |
| Feed | Rich client pipeline with visibility filtering | IMPLEMENTED_DIFFERENTLY | `FeedViewModel` + `LiveFeedService` reimplement pipeline | Strong parity, separate implementation |
| Chat/inbox/conversation | Shared chat engine over `chat.*` | IMPLEMENTED_DIFFERENTLY | Native inbox/conversation services, realtime store, polling | Native does not use `@chat`; write authority differs |
| Notifications | Actor-scoped list + header count + badge polling/events | IMPLEMENTED_DIFFERENTLY | Native list/filter/read-state view-model/service | No clear native bell realtime path |
| Composer/post detail | Upload helpers + controllers + many local hooks | IMPLEMENTED_DIFFERENTLY | Strong native composer and post-detail services/view-models | Good parity, but direct native service authority |
| Profiles/settings | Kind-aware profiles, privacy, account, VPORT management | IMPLEMENTED_DIFFERENTLY | Strong native profile/settings/VPORT service layer | Main drift is identity/ownership authority |
| VPORT public/business | Public menu, dashboard, booking, gas, reviews, settings | IMPLEMENTED | Native screens and routes exist for these surfaces | Need deeper per-surface parity review, but coverage is real |
| Wanders | Separate async card system | IMPLEMENTED | Native Wanders home/create/claim/detail/DAL/store exist | Needs dedicated audit, but not absent |
| Realtime/push | Chat engine realtime + badge polling/events + PWA SW | PARTIALLY_IMPLEMENTED | APNs token registration, inbox realtime, badge polling, conversation polling | Push-open flows and broader realtime parity remain incomplete |

## 17. Current parity gaps
- Identity is the biggest gap. Web identity is platform/engine/hydration based. Native identity is currently domain-table/service based.
- Actor switching is not equivalent. Web persists active actor choice through platform preference state. Native currently switches by replacing `AuthSession.activeIdentity`.
- Chat authority differs. Web centralizes through shared chat engine contracts. Native sends/edits/unsends through direct service methods and explicit inbox-entry upkeep.
- Notification semantics differ. Web has a separate header count/badge behavior and event refresh model. Native derives unread state from loaded list state and direct service calls.
- Realtime coverage differs. Native has inbox realtime plus polling, but conversation and notifications are not as centralized as web chat/notification behavior.
- Native uses direct Supabase service code instead of the web engine adapters. That is acceptable for current runtime documentation, but it is a real long-term drift vector.

## 18. Biggest risks in the current native runtime
- Identity authority drift:
  - web source of truth is platform + engine + hydrator
  - native source of truth is `AuthSession.activeIdentity` plus direct Supabase lookups
- Actor-switch persistence drift:
  - native switch appears session-local, not platform-backed
- Chat mutation drift:
  - native conversation mutations currently bypass web `@chat` engine contracts
- Monolithic data client risk:
  - `SupabaseClient` is convenient but centralizes a large amount of write/read authority
- Realtime inconsistency:
  - inbox has realtime and polling
  - conversations rely on polling
  - notifications do not show equivalent realtime behavior

## 19. Immediate native documentation priorities
- Build a native identity and actor-switch runtime doc focused on `AuthSession.activeIdentity`, `LiveAuthService`, and `LiveSettingsService.switchActiveIdentity(...)`.
- Build a native chat mutation doc covering `LiveInboxService`, `LiveConversationService`, inbox realtime, polling, and direct write paths.
- Build a native service-to-table map for `SupabaseClient` so current runtime authority is explicit.
- Build a native VPORT/business runtime doc covering dashboard, booking, public menu, gas, and owner settings.
- Build a native Wanders runtime doc because current coverage is real and non-trivial.

## 20. Final current-runtime verdict
The current native app is a real product runtime, not a starter shell. It already covers auth, onboarding, feed, inbox, conversations, notifications, composer, post detail, profiles, settings, VPORT management, public VPORT surfaces, booking, dashboard screens, gas screens, and Wanders.

The main issue is not missing UI breadth. The main issue is architectural drift from the web source system:

- web runtime is engine-backed for identity/chat
- native runtime is service-backed and Supabase-client-driven

So the correct current-runtime verdict is:

- native is broad and operational
- native is not a direct runtime port of web architecture
- parity is strongest in feed/composer/post-detail/UI coverage
- parity is weakest in identity authority, actor switching, and chat runtime authority
