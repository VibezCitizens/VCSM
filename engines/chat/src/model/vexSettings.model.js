export const DEFAULT_INBOX_VISIBILITY_SETTINGS = {
  hideEmptyConversations: false,
  showThreadPreview: true,
}

export function normalizeInboxVisibilitySettings(raw) {
  const merged = { ...DEFAULT_INBOX_VISIBILITY_SETTINGS, ...(raw || {}) }

  if (
    raw &&
    typeof raw.showThreadPreview !== 'boolean' &&
    typeof raw.showMessagePreview === 'boolean'
  ) {
    merged.showThreadPreview = raw.showMessagePreview
  }

  return {
    hideEmptyConversations: Boolean(merged.hideEmptyConversations),
    showThreadPreview: Boolean(merged.showThreadPreview),
  }
}

export function hasInboxConversationContent(entry) {
  const hasLastMessage = Boolean(entry?.lastMessageId)
  const hasUnread = Number(entry?.unreadCount || 0) > 0
  const hasPreviewText =
    String(entry?.preview || entry?.lastMessageBody || '').trim().length > 0
  return hasLastMessage || hasUnread || hasPreviewText
}

export function shouldShowInboxEntry(entry, settings) {
  if (!settings?.hideEmptyConversations) return true
  return hasInboxConversationContent(entry)
}

export const DEFAULT_VEX_SETTINGS = DEFAULT_INBOX_VISIBILITY_SETTINGS
export const normalizeVexSettings = normalizeInboxVisibilitySettings
