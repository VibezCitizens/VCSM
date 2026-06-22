# Session Summary — psl-foundation-notification-engine-migration (2026-04-12)

## What was worked on

- **Platform Service Layer (PSL) foundation** — Created `platform/services/` with `identityService` and `actorService` (implemented) plus `notificationService` and `chatService` (stubs). New shared root between apps and engines.
- **Full VCSM notification engine migration** — Migrated the entire notification system from legacy `vc.notifications` (DB triggers + direct DAL) to the `notification.*` schema via the notification engine. Completed across planning sequences 15-19: engine wiring → read path → header/realtime → write path (booking/review) → write path (follow) → write path (all 7 post-interaction events). All 14 notification events now publish through the engine.
- **Traffic locksmith SEO vertical (Batman)** — Extended Traffic mock data with locksmith service, 9 specialties, 3 providers. Created all 4 missing dynamic route pages (city, city+service, neighborhood+service, provider) plus sitemap route. These serve all services, not just locksmith.
- **Traffic ↔ Vport integration audit (Batman)** — Full code-derived architectural audit recommending Option C (hybrid model): Traffic keeps own provider records with optional `vcsmActorId` field for claimed listings.
- **Documentation and governance updates** — Updated CLAUDE.md to reflect 3 apps (added Traffic). Created Traffic REVIEW.md. Updated 4 Logan notification docs to reflect migration state. Created PSL Logan doc.

## Decisions made

- **PSL uses relative engine imports** — `../../engines/identity/index.js` instead of Vite aliases like `@identity`, so the platform layer doesn't depend on app-specific build config. SENTRY drift resolved.
- **Notification adapter pattern** — Created `publishVcsmNotification()` adapter that maps the legacy `dalInsertNotification` call shape to engine `publishEvent()`. All 14 controllers use this single adapter.
- **Self-notification prevention in adapter** — `actorId === recipientActorId` skip built into the adapter, so every caller gets it automatically.
- **Dual-write strategy for notifications** — Legacy DB triggers remain active (writing to `vc.notifications`), but UI reads only from `notification.*`. This makes the migration safe — legacy writes are invisible. Triggers will be disabled in a separate DB migration.
- **Publish only on create, not undo** — Reaction toggle-off and comment unlike produce no notification. Explicit `created` booleans track this.
- **Mention publish in controller, not DAL** — `publishVcsmNotificationBatch()` called from `createPostController.js` (orchestration layer), not from `insertPostMentions.js` (DAL).
- **Traffic architecture: Option C hybrid** — Traffic keeps standalone provider records with future `vcsmActorId` bridge for claimed listings.

## Files changed

### New files
- `platform/services/index.js`
- `platform/services/identityService.js`
- `platform/services/actorService.js`
- `platform/services/notificationService.js`
- `platform/services/chatService.js`
- `apps/VCSM/src/features/notifications/setup.js`
- `apps/VCSM/src/features/notifications/publish.js`
- `apps/Traffic/REVIEW.md`
- `apps/Traffic/src/app/(seo)/[city]/page.jsx`
- `apps/Traffic/src/app/(seo)/[city]/[service]/page.jsx`
- `apps/Traffic/src/app/(seo)/[city]/[neighborhood]/[service]/page.jsx`
- `apps/Traffic/src/app/(seo)/pro/[providerSlug]/page.jsx`
- `apps/Traffic/src/app/sitemaps/[chunk]/route.js`
- `apps/Traffic/docs/TRAFFIC_VPORT_INTEGRATION_AUDIT.md`
- `logan/architecture/platform-service-layer.md`
- `planning/batman/april/12/BAT-12-01.md`
- `planning/batman/april/12/BAT-12-02.md`
- `planning/.batsignal.md`

### Modified files
- `CLAUDE.md` — added Traffic as third app, added Traffic review trigger
- `apps/VCSM/src/main.jsx` — added `setupVcsmNotificationsEngine()`
- `apps/VCSM/src/features/notifications/inbox/controller/Notifications.controller.js` — engine inbox API
- `apps/VCSM/src/features/notifications/inbox/controller/inboxUnread.controller.js` — engine countUnread
- `apps/VCSM/src/features/notifications/inbox/controller/notificationsCount.controller.js` — engine countUnread
- `apps/VCSM/src/features/notifications/inbox/controller/NotificationsHeader.controller.js` — engine APIs
- `apps/VCSM/src/features/notifications/inbox/model/notification.mapper.js` — engine InboxNotification shape
- `apps/VCSM/src/features/notifications/inbox/lib/blockFilter.js` — configurable getActorId
- `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js` — notification.* schema
- `apps/VCSM/src/features/booking/controller/createBooking.controller.js` — engine publish
- `apps/VCSM/src/features/booking/controller/confirmBooking.controller.js` — engine publish
- `apps/VCSM/src/features/booking/controller/cancelBooking.controller.js` — engine publish
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js` — engine publish
- `apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js` — engine publish
- `apps/VCSM/src/features/social/friend/request/controllers/followRequests.controller.js` — engine publish
- `apps/VCSM/src/features/post/postcard/controller/togglePostReaction.controller.js` — engine publish
- `apps/VCSM/src/features/post/postcard/controller/sendRose.controller.js` — engine publish
- `apps/VCSM/src/features/post/commentcard/controller/postComments.controller.js` — engine publish
- `apps/VCSM/src/features/post/commentcard/controller/commentReactions.controller.js` — engine publish
- `apps/VCSM/src/features/upload/controllers/createPostController.js` — engine publish (mentions)
- `apps/Traffic/src/data/connectors/mockDataset.js` — locksmith data
- `logan/vcsm/notifications/vcsm.notifications.pipeline.md` — full rewrite
- `logan/vcsm/notifications/vcsm.notifications.coverage-audit.md` — updated coverage status
- `logan/vcsm/notifications/vcsm.notifications.engine-extraction-plan.md` — updated verdict
- `logan/engines/engines.notifications.engine-architecture.md` — added integration change log

### Deleted files
- `apps/VCSM/src/features/notifications/inbox/dal/notifications.dal.js` — orphaned
- `apps/VCSM/src/features/notifications/inbox/dal/notifications.read.dal.js` — orphaned
- `apps/VCSM/src/features/notifications/inbox/dal/notifications.count.dal.js` — orphaned

## Problems solved

- **Notification system fragmentation** — The entire VCSM notification system was split between legacy DB triggers (writing to `vc.notifications`) and the new engine (reading from `notification.*`). Bridged by adding engine publish calls to all 14 event-producing controllers while keeping triggers as safety net.
- **Post-interaction recipient resolution gap** — Social controllers (reactions, comments, roses) didn't have recipient actor IDs (DB triggers resolved these via JOINs). Solved by adding minimal PK reads to fetch post owner / comment author at action time.
- **PSL import alias drift** — Platform services initially used Vite aliases (`@identity`, `@hydration`) that only resolve through VCSM's build config. Fixed by switching to relative paths for cross-app portability.
- **Self-notification risk** — Added centralized self-notification skip in the `publishVcsmNotification` adapter so no controller can accidentally notify an actor about their own action.

## Open items

- **Register `notification.event_types` rows** for all 14 event keys (DB task — needed for template rendering)
- **Create `notification.templates`** for rendered notification content (title/body text per event)
- **Disable legacy DB triggers** on `vc.*` tables once engine writes are verified stable (DB migration)
- **Remove last 2 legacy DALs** — `notifications.create.dal.js` and `notifications.write.dal.js` (still used by dev diagnostics)
- **Professional Briefings reader** — still reads from `vc.notifications`, not yet migrated
- **Stale `.tp-incoming.md`** — contains an outdated follow notification task that was already completed; should be cleared
- **Traffic route pages modified by user** — The user made significant changes to Traffic route pages after Batman created them (added geo/country/region/locality support). Those changes are user-driven and outside this session's scope.

## Context for next session

The notification engine migration is **feature-complete on the code side** — all 14 VCSM notification events now publish through the engine via `publishVcsmNotification()` / `publishVcsmNotificationBatch()`. The read path, badge, realtime, and write path are all on `notification.*`. What remains is **database-level work**: registering event types and templates in `notification.event_types` / `notification.templates` for rendered content, then disabling the 10+ legacy DB triggers on `vc.*` tables. The Platform Service Layer foundation exists at `platform/services/` but no app consumes it yet — that's a separate future integration. Traffic has locksmith SEO pages and a full vport integration audit recommending Option C (hybrid with `vcsmActorId` bridge).
