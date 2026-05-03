export const queryKeys = {
  centralFeed: (actorId, realmId) => ['feed', 'central', actorId, realmId],
  notificationUnread: (actorId) => ['notifications', 'unread', actorId],
  notificationsInbox: (actorId) => ['notifications', 'inbox', actorId],
  chatUnread: (actorId) => ['bootstrap', 'chat-unread', actorId],
  actorContext: (userId) => ['identity', 'engine-ctx', userId],
  vportProfileBySlug: (slug) => ['vport', 'profile-by-slug', slug],
  vportProfile: (actorId) => ['vport', 'profile', actorId],
  vportPublicDetails: (actorId) => ['vport', 'public-details', actorId],
  resources: (actorId) => ['vport', 'resources', actorId],
  availability: (actorId) => ['vport', 'availability', actorId],
  bookings: (actorId, range) => ['vport', 'bookings', actorId, range],

  // Chat
  chatInbox: (actorId) => ['chat', 'inbox', actorId],
  chatUnreadCount: (actorId) => ['chat', 'unread', actorId],
  chatConversation: (conversationId) => ['chat', 'conversation', conversationId],
  chatMessages: (conversationId) => ['chat', 'messages', conversationId],
  chatParticipants: (conversationId) => ['chat', 'participants', conversationId],

  // Public profile view
  // canViewContent is included so cache entries for private vs open profiles are distinct.
  profileView: (viewerActorId, profileActorId, canViewContent) =>
    ['profile', 'view', viewerActorId, profileActorId, canViewContent ?? 'pending'],

  // Paginated posts for the Vibes tab — keyed by actorId only.
  // Invalidate this when a post is deleted to bust the React Query page cache.
  actorPosts: (actorId) => ['profile', 'posts', actorId],

  // Settings
  settingsAccount: (actorId) => ['settings', 'account', actorId],
  settingsProfile: (userId) => ['settings', 'profile', userId],
  settingsVportProfile: (vportId) => ['settings', 'vport-profile', vportId],
  settingsPrivacy: (actorId) => ['settings', 'privacy', actorId],
  settingsBlockedCitizens: (actorId) => ['settings', 'blocked-citizens', actorId],
  settingsVports: (userId) => ['settings', 'vports', userId],
  settingsVportPublicDetails: (profileId) => ['settings', 'vport-public-details', profileId],
  settingsCitizenSearch: (actorId, searchText) => ['settings', 'citizen-search', actorId, searchText],
}
