import { getChatInboxUnreadBadgeCount } from '@/features/chat/inbox/controller/chatUnread.controller'

export function useChatUnreadOps() {
  return { getUnreadBadgeCount: getChatInboxUnreadBadgeCount }
}
