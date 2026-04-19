// platform/services/index.js
// ============================================================
// Platform Service Layer — Public API
// ============================================================
// Barrel export for all platform services.
//
// Architecture:
//   Apps → platform/services → engines → DAL → Database
//
// Rules:
//   - Services never export DAL functions
//   - Services never import from apps
//   - Services consume engines through their public APIs
//   - Apps should import from this file, not from engines directly
//
// Status:
//   - identityService:     IMPLEMENTED (wraps identity + hydration engines)
//   - actorService:        IMPLEMENTED (wraps hydration engine store + fetch)
//   - notificationService: STUB (API shape defined, pending engine migration)
//   - chatService:         STUB (API shape defined, pending facade build)
// ============================================================

// Identity Service — platform context, actor resolution, session state
export {
  getPlatformContext,
  getActiveActor,
  getActorLinks,
  switchActor,
  getUserAppState,
} from './identityService.js'

// Actor Service — canonical actor bundle resolution and caching
export {
  getActorBundle,
  getActorBundles,
  getActorBundleMap,
  getActorSummaries,
  getActorFromStore,
  isActorStale,
  invalidateActors,
} from './actorService.js'

// Notification Service — event publishing, inbox, unread counts (stub)
export {
  publishNotification,
  getUnreadSummary,
  getInbox as getNotificationInbox,
  markRead as markNotificationRead,
  dismiss as dismissNotification,
} from './notificationService.js'

// Chat Service — conversations, messaging, inbox (stub)
export {
  getInbox as getChatInbox,
  getUnreadCount as getChatUnreadCount,
  sendMessage,
  createConversation,
  markConversationRead,
} from './chatService.js'
