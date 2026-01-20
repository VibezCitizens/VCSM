// src/features/moderation/types/moderation.js
export const REPORT_OBJECT_TYPES = /** @type {const} */ ([
  'actor',
  'post',
  'comment',
  'message',
  'conversation',
  'profile',
  'vport',
])

export const REPORT_REASONS = /** @type {const} */ ([
  'spam',
  'harassment',
  'hate',
  'nudity',
  'violence',
  'scam',
  'illegal',
  'self_harm',
  'impersonation',
  'copyright',
  'privacy',
  'other',
])

export const REPORT_STATUSES = /** @type {const} */ ([
  'open',
  'triaged',
  'needs_more_info',
  'actioned',
  'dismissed',
])
