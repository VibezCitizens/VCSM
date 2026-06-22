# ARCHITECT — Dependency Map
Generated: 2026-05-09

---

## VCSM — Core Dependency Chains

### Feed Flow
CentralFeedScreen
 → useFeed (hook)
 → FeedController (getFeedViewerContext, listActorPosts, getDebugPrivacyRows)
 → feed.read.*.dal.js (9 DAL reads)
 → Supabase: vc.posts, vc.actors, vc.blocks, vc.actor_follows, vc.post_media, vc.post_reactions, vc.comments

### Auth / Identity Flow
App bootstrap
 → bootstrap.hydrate.controller.js
 → engines/identity → resolveAuthenticatedContext.controller.js
 → identity.controller.js (VCSM app-level)
 → ensureVcsmPlatformBootstrap.controller.js
 → actorStore.js (Zustand)
 → identitySelection.store.js (Zustand)

### Profile Resolution Flow
ProfileScreen (final)
 → useProfileView (hook)
 → getProfileView.controller.js
 → resolveActorBySlug.controller.js → resolveActorSlug.dal.js
 → readActorProfile.dal.js
 → readActorKind.dal.js
 → engines/hydration → hydrateActor.controller.js → actorStore.js

### Vport Dashboard Flow
VportDashboardScreen (final)
 → useDashboard (hook)
 → vportOwnerStats.controller.js
 → dashboard/vport/dal/read/*.read.dal.js
 → engines/booking (resource availability, bookings)
 → engines/portfolio (portfolio items)
 → engines/reviews (review stats)

### Chat Flow
ConversationScreen (final)
 → useConversation (hook)
 → engines/chat → getConversationMessages.controller.js
 → engines/chat → getConversationMembers.controller.js
 → engines/chat → evaluateConversationPolicy.controller.js (block check)
 → chat.dal.js suite

### Notifications Flow
NotificationsScreen (final)
 → useNotifications (hook)
 → Notifications.controller.js
 → engines/notifications → getInbox.controller.js
 → engines/notifications → countUnread.controller.js
 → notifications.dal.js suite

### Upload / Post Creation Flow
PostUploadUI
 → useCreatePost (hook)
 → createPost.controller.js
 → insertPost.dal.js → vc.posts
 → insertPostMedia.dal.js → vc.post_media
 → insertPostMentions.dal.js → vc.post_mentions
 → engines/media → uploadMedia.controller.js → engines/media/dal/r2Upload.dal.js

### Booking Flow (Customer)
BookingScreen
 → useCreateBooking (hook)
 → createBooking.controller.js (app) → engines/booking → createBooking.controller.js
 → booking.write.dal.js → vport.bookings

### Moderation Flow
ModerationAction
 → moderationActions.controller.js
 → assertModerationAccess.dal.js (pre-flight auth check)
 → moderationActions.dal.js

---

## VCSM — Cross-Feature Dependencies

| Consumer Feature | Depends On |
|---|---|
| feed | actors (via hydration), block, social |
| profiles | social, booking, reviews, portfolio, upload |
| dashboard | booking (engine), portfolio (engine), reviews (engine), media |
| chat | block, identity, media |
| notifications | identity, chat (event triggers) |
| public | profiles, reviews (engine), portfolio (engine) |
| settings | identity, auth, profiles, vport |
| upload | post, media |
| onboarding | auth, identity, social |

---

## VCSM — Adapter Pattern (Cross-Feature Isolation)

block feature exposes:
 → useBlockActorAction.adapter.js (consumed by chat)
 → useBlockStatus.adapter.js (consumed by profiles, chat)

chat feature exposes:
 → useStartConversation.adapter.js (consumed by profiles, booking)

ads feature exposes:
 → useVportAds.adapter.js (consumed by dashboard)

---

## TRAFFIC — Dependency Chain

/[city]/[segment]/[service]/page.jsx
 → generateStaticParams → staticParams.repo.js → taxonomyParams.repo.js → trazeCategories.read.dal.js → public_traze_provider_index_v
 → page data → vportDataset.controller.js → vportDataset.read.dal.js → public_traze_provider_index_v
 → provider.repo.js → providerProfile.read.dal.js → public_traze_portfolio_v

/pro/[providerSlug]/page.jsx
 → provider.repo.js → providerProfile.read.dal.js → public_traze_portfolio_v
 → reviewSummary.repo.js → publicReviewSummary.connector.js

homepage (/)
 → homepage.repo.js → vportHomepage.connector.js → vportHomepage.read.dal.js → public_traze_provider_index_v

---

## Dependency Violations Detected

### VCSM — Duplicate Controller Location (profiles feature)
apps/VCSM/src/features/profiles/controller/*.controller.js (canonical)
AND
apps/VCSM/src/features/profiles/screens/views/tabs/friends/controller/*.controller.js (duplicate)
AND
apps/VCSM/src/features/profiles/screens/views/tabs/post/controllers/*.controller.js (duplicate)
AND
apps/VCSM/src/features/profiles/screens/views/tabs/tags/controller/*.controller.js (duplicate)
AND corresponding DAL duplicates in screens/views/tabs/*/dal/

STATUS: HIGH RISK — these are direct duplicates of controllers and DAL already at the correct layer.
The canonical path (features/profiles/controller/ and features/profiles/dal/) is authoritative.
The screen-nested copies are layer violations — controllers must not live inside screen folders.

### VCSM — Booking Dual Implementation
apps/VCSM/src/features/booking/controller/*.controller.js (app-level)
AND
engines/booking/src/controller/*.controller.js (engine-level)
Both implement createBooking, ensureOwnerBookingResource, getResourceAvailability, listBookingHistory.
The app-level booking controllers may be thin wrappers or may be independent.
Verify: app booking controllers must only call engine booking controllers, not duplicate their logic.

### VCSM — Block Table Read in Two Engines
engines/chat/src/dal/blockRelations.read.dal.js
apps/VCSM/src/features/block/dal/block.read.dal.js
Both read vc.blocks. No circular dependency but potential duplicate reads when chat and feed both need block state.

---

## Circular Dependency Check

No circular dependencies detected at the module boundary level.
apps → engines is the correct direction throughout.
No engine file was found importing from apps/.
