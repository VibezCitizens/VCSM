# Module: Notifications / badges / realtime fallback

## PWA Source of Truth

**Routes:** `/notifications`, `/noti/post/:id`

**Screens/components:**
- `apps/VCSM/src/features/notifications/*`
- `apps/VCSM/src/bootstrap/*`

**Services/DAL:**
- `apps/VCSM/src/features/notifications/inbox/*`
- `apps/VCSM/src/features/notifications/realtime/*`

**Supabase schema/tables/RPCs:**
- `notification.inbox_full_view`
- `notification.recipients`
- `notification.inbox_items`
- `vc.device_push_tokens`
- realtime channels
- booking/comment/follow/mention/reaction/review notification payloads

**RLS expectations:** Unread counts and notification rows must be scoped to the authenticated active actor; realtime must have a polling fallback.

**Current PWA status:** Source of truth for notification type handling, unread count, realtime subscription, and fallback polling semantics.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Notifications/NotificationsView.swift`
- `VCSMNativeApp/Features/Notifications/NotificationsViewModel.swift`
- `VCSMNativeApp/Services/Notifications/LiveNotificationsService.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient+Push.swift`
- `VCSMNativeApp/App/AppNavigationView.swift`

---

## Native Behavior Currently Present

- Native notifications screen, realtime/polling support, view model, badge wiring, and push token upsert path exist.
- Prior audit found realtime plus 60-second polling fallback in `NotificationsView`.
- Native notification reads now use `notification.inbox_full_view`; seen/read writes use `notification.inbox_items`; realtime listens to `notification.recipients`.

---

## Native Gaps

- Push token payload appears sparse; confirm user/actor association and RLS.
- Badge clearing and tab badge behavior need parity testing across active actor switches.
- Runtime notification list, seen/read, badge count, and realtime behavior not yet tested against Supabase after schema alignment.

---

## Risk Notes

- `SupabaseClient+Push.swift:15-38` upserts `vc.device_push_tokens` with token/platform fields — actor association and RLS need verification.
- Realtime reliability on iOS background/sleep requires polling to remain active on foreground return.
- `vc.notifications` is retired for native reads/writes and must not be used.

---

## Pending Transfer Checklist

- [x] Map each notification type to native row UI and destination route — verified 2026-05-04: all 15 PWA types (follow, follow_request, follow_request_accepted, comment, comment_reply, comment_like, like, dislike, post_rose, post_mention, booking_created, booking_confirmed, booking_cancelled, review_created, team_invite) have corresponding native handlers with proper card UI and tap-to-navigate routes.
- [x] Align unread/list/seen/read paths to `notification` engine tables/views.
- [ ] Runtime verify unread count query and badge clear behavior.
- [ ] Validate push token RLS and actor/user ownership.
- [ ] Test active actor switch does not leak prior actor's notifications.

---

## PWA → Native Transfer Log

- Date: 2026-05-10
- Change type: Fix / Runtime parity / Push ownership
- PWA files changed: none — transfer from Logan notification docs in `_CANONICAL/logan/vcsm/notifications/`
- Routes affected: `/notifications`, notification deep links, push notification deep links
- Screens/components changed: native `NotificationsView.swift`, native app badge wiring
- Services/DAL changed: native `LivePushNotificationService.swift`, `SupabaseClient+Push.swift`
- Behavior change: align native bell notifications to current PWA polling-only freshness contract; improve fallback routing for booking/review/lead/chat/post notification payloads; register push tokens with user/active-actor ownership when schema supports it
- Supabase schema/RPC change: no schema change; uses existing `notification.*` reads/writes and `vc.device_push_tokens`
- RLS expectations changed: push token rows should be scoped to authenticated user and active actor when columns exist; legacy sparse-token fallback remains only for backwards-compatible schemas
- Affected native modules: Notifications, Push, Navigation
- Priority: P1
- Native status: Partial
- Testing notes: pending native build and runtime Supabase verification
- Notes: Learning/Wentrex notification events are explicitly out of native scope.

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: (none — tracker refresh only)
- Delta status: Partial — type card parity and actor-switch badge isolation not verified
- Notes: Initial tracker from ROADTRIP.docx May 3 refresh

### 2026-05-10 — Logan notification contract transfer

- Date: 2026-05-10
- Change type: Fix / Runtime parity / Push ownership
- PWA files changed: none — transferred from Logan notification pipeline docs
- Routes affected: `/notifications`, notification deep links, push notification deep links
- Screens/components changed: `NotificationsView.swift`, `AppNavigationView.swift`
- Services/DAL changed: `LivePushNotificationService.swift`, `SupabaseClient+Push.swift`
- Behavior change: native notification list and badge now use 60-second polling without starting `notification.recipients` realtime observers; notification rows and push payloads can route booking/review/lead/team/chat/post payloads through native route fallbacks; APNs token registration attempts user + active actor ownership first, then falls back for older table shapes
- Supabase schema/RPC change: no schema change
- RLS expectations changed: `vc.device_push_tokens` should accept authenticated user/actor ownership columns when deployed
- Affected native modules: Notifications, Push, Navigation
- Priority: P1
- Native status: Partial
- Testing notes: `swift build --package-path native/VCSMNativeCore` passed; Swift parse and `git diff --check` passed for touched native files; full app `xcodebuild` blocked by Command Line Tools-only Xcode install
- Notes: Runtime Supabase verification remains pending for badge clear, actor switch isolation, and push-token RLS.

### 2026-05-03 — Runtime schema alignment

- Date: 2026-05-03
- Change type: Fix / Schema / Realtime
- PWA files changed: none — alignment to `_HISTORY/db/snapshots/schema_20260502b.sql`
- Routes affected: `/notifications`, tab badge
- Screens/components changed: none
- Services/DAL changed: `SupabaseClient.swift`, `SupabaseNotificationModels.swift`, `NotificationsView.swift`
- Behavior change: native no longer reads/writes retired `vc.notifications`; list/count use `notification.inbox_full_view`, seen/read writes patch `notification.inbox_items`, and realtime listens to `notification.recipients`
- Supabase schema/RPC change: `notification.inbox_full_view`, `notification.recipients`, `notification.inbox_items`
- RLS expectations changed: no — notification rows remain active-actor scoped
- Affected native modules: Notifications, badges, realtime fallback
- Priority: P0
- Native status: Risky — build verified
- Testing notes: iOS simulator `xcodebuild` passed; static scan found no native `vc.notifications` or `/notifications` REST path references. Runtime notification regression not yet run.
- Notes: Addresses screenshot error `relation "vc.notifications" does not exist`.

---

## Archived Notes

No archived notes yet.
