// src/types/index.js
// ============================================================
// Chat Engine — Domain Type Definitions (JSDoc)
// ============================================================

/**
 * Phase 1 allows actorSource to be optional in runtime payloads while the
 * storage layer is still bridging legacy schemas. Phase 2 makes actorSource a
 * required part of the shared-chat storage contract.
 *
 * @typedef {'learning'|'vc'} ActorSource
 */

/**
 * @typedef {Object} ActorRef
 * @property {ActorSource|null} actorSource
 * @property {string} actorId
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} conversationId
 * @property {ActorSource|null} [senderActorSource]
 * @property {string} senderActorId
 * @property {'text'|'image'|'video'|'file'|'system'} kind
 * @property {'text'|'image'|'video'|'file'|'system'} type
 * @property {string|null} body
 * @property {string|null} replyToMessageId
 * @property {number|null} conversationSeq
 * @property {string} createdAt
 * @property {string|null} editedAt
 * @property {string|null} deletedAt
 * @property {boolean} isEdited
 * @property {boolean} isDeleted
 * @property {boolean} isHidden
 * @property {boolean} isSystem
 * @property {string|null} clientId
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {'direct'|'group'} conversationKind
 * @property {boolean} isGroup
 * @property {boolean} isStealth
 * @property {ActorSource|null} [createdByActorSource]
 * @property {string} createdByActorId
 * @property {string|null} title
 * @property {string|null} avatarUrl
 * @property {string|null} lastMessageId
 * @property {string|null} lastMessageAt
 * @property {string} realmId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} ConversationMember
 * @property {ActorSource|null} [actorSource]
 * @property {string} actorId
 * @property {'user'|'vport'|null} kind
 * @property {string|null} displayName
 * @property {string|null} username
 * @property {string|null} photoUrl
 * @property {string|null} vportName
 * @property {string|null} vportSlug
 * @property {string|null} vportAvatarUrl
 * @property {'owner'|'admin'|'member'} role
 * @property {boolean} isActive
 * @property {string|null} membershipStatus
 */

/**
 * @typedef {Object} InboxEntry
 * @property {string} conversationId
 * @property {ActorSource|null} [actorSource]
 * @property {string} actorId
 * @property {'inbox'|'archived'|'spam'|'requests'} folder
 * @property {string|null} lastMessageId
 * @property {string|null} lastMessageAt
 * @property {string|null} lastMessageBody
 * @property {number} unreadCount
 * @property {boolean} pinned
 * @property {boolean} archived
 * @property {boolean} muted
 * @property {boolean} archivedUntilNew
 * @property {string|null} historyCutoffAt
 * @property {Array<InboxMember>} members
 * @property {ActorSource|null} [partnerActorSource]
 * @property {string|null} partnerActorId
 * @property {string|null} partnerKind
 * @property {string|null} partnerDisplayName
 * @property {string|null} partnerUsername
 * @property {string|null} partnerPhotoUrl
 * @property {string|null} preview
 */

/**
 * @typedef {Object} InboxMember
 * @property {ActorSource|null} [actorSource]
 * @property {string} actorId
 * @property {string|null} kind
 * @property {string|null} displayName
 * @property {string|null} username
 * @property {string|null} photoUrl
 */

/**
 * @typedef {Object} PermissionSnapshot
 * @property {boolean} canViewConversation
 * @property {boolean} canSendMessage
 * @property {boolean} canEditOwnMessage
 * @property {boolean} canHideMessage
 * @property {boolean} canDeleteOwnMessage
 * @property {boolean} canDeleteAnyMessage
 * @property {boolean} canManageMembers
 * @property {boolean} canLeaveConversation
 * @property {boolean} canArchiveConversation
 * @property {boolean} canMarkConversationSpam
 * @property {boolean} canModerate
 */

/**
 * @typedef {Object} MessageReceipt
 * @property {string} messageId
 * @property {ActorSource|null} [actorSource]
 * @property {string} actorId
 * @property {'delivered'|'read'} status
 * @property {string|null} deliveredAt
 * @property {string|null} seenAt
 * @property {string|null} hiddenAt
 */

/**
 * @typedef {Object} ActorSearchResult
 * @property {ActorSource|null} [actorSource]
 * @property {string} actorId
 * @property {string} id
 * @property {'user'|'vport'|null} kind
 * @property {string|null} displayName
 * @property {string|null} username
 * @property {string|null} photoUrl
 */

/**
 * @typedef {Object} InboxVisibilitySettings
 * @property {boolean} hideEmptyConversations
 * @property {boolean} showThreadPreview
 */

/**
 * @typedef {Object} ChatEventEnvelope
 * @property {string} eventName
 * @property {number} version
 * @property {string} occurredAt
 * @property {string} source
 * @property {Object} payload
 */

export default {}
