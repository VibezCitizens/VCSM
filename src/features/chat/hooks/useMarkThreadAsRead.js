import { useEffect } from 'react';
import { markConversationRead } from '@/features/chat/api/chatApi.views';

/**
 * Automatically marks a conversation as read when opened or focused.
 *
 * @param {Object} params
 * @param {string} params.conversationId - The conversation UUID
 * @param {string} params.myActorId - Current user or vport actor UUID
 * @param {Array}  params.messages - All messages in the conversation
 * @param {boolean} params.ready - Whether the component has finished loading
 */
export default function useMarkThreadAsRead({ conversationId, myActorId, messages, ready }) {
  useEffect(() => {
    if (!ready || !conversationId || !myActorId) return;

    const markRead = () => {
      if (!messages || !messages.length) return;
      const lastMessage = messages[messages.length - 1];
      const lastMessageId = lastMessage?.id;
      if (!lastMessageId) return;
      markConversationRead(conversationId, myActorId, lastMessageId);
    };

    markRead(); // on initial load

    const handleFocus = () => markRead();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markRead();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [conversationId, myActorId, messages.length, ready]);
}
