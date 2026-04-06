// src/features/chat/constants/inboxFlags.js
// ============================================================
// Inbox Flags
// ------------------------------------------------------------
// - Central source of truth for inbox entry flags
// - Must stay aligned with vc.inbox_entries columns
// ============================================================

/**
 * Boolean flags stored on vc.inbox_entries
 */
export const INBOX_FLAGS = {
  PINNED: 'pinned',
  ARCHIVED: 'archived',
  MUTED: 'muted',
  ARCHIVED_UNTIL_NEW: 'archived_until_new',
}

/**
 * Flags that visually de-emphasize a conversation
 */
export const PASSIVE_INBOX_FLAGS = [
  INBOX_FLAGS.ARCHIVED,
  INBOX_FLAGS.MUTED,
]

/**
 * Flags that change ordering priority
 */
export const PRIORITY_INBOX_FLAGS = [
  INBOX_FLAGS.PINNED,
]

/**
 * Helpers
 * ------------------------------------------------------------
 */

/**
 * Check if an inbox entry is muted
 */
export function isMuted(entry) {
  return Boolean(entry?.muted)
}

/**
 * Check if an inbox entry is archived
 */
export function isArchived(entry) {
  return Boolean(entry?.archived)
}

/**
 * Check if an inbox entry is pinned
 */
export function isPinned(entry) {
  return Boolean(entry?.pinned)
}

/**
 * Should this conversation visually pop?
 * (unread + not muted)
 */
export function shouldHighlight(entry) {
  return (
    Boolean(entry?.unread_count > 0) &&
    !entry?.muted
  )
}

/**
 * Should this conversation be hidden from main inbox list?
 * (archived unless explicitly viewing archive)
 */
export function shouldHideFromInbox(entry, showArchived = false) {
  if (showArchived) return false
  return Boolean(entry?.archived)
}
