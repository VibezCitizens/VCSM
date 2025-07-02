import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MessageInput({ conversationId, currentUser, onSend }) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content || !currentUser?.id) return;

    setSending(true);
    const userId = currentUser.id;

    try {
      // ✅ Step 1: Ensure membership
      const { data: existingMember, error: checkError } = await supabase
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingMember && !checkError) {
        const { error: insertError } = await supabase
          .from('conversation_members')
          .insert([{ conversation_id: conversationId, user_id: userId }]);

        if (insertError) {
          console.error('Failed to auto-add member:', insertError.message);
          return;
        }
      }

      // ✅ Step 2: Send message
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            content,
            conversation_id: conversationId,
            sender_id: userId,
          }
        ])
        .select('id, content, sender_id, created_at')
        .single();

      if (error) {
        console.error('Message insert error:', error.message);
        return;
      }

      const message = {
        ...data,
        sender: {
          display_name: currentUser.profile?.display_name ||
                        currentUser.user_metadata?.display_name || 'You',
          photo_url: currentUser.profile?.photo_url ||
                     currentUser.user_metadata?.photo_url || '/default-avatar.png',
        },
      };

      onSend(message);
      setMessageText('');
    } catch (err) {
      console.error('Unexpected error:', err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center space-x-2 px-4 py-3 border-t border-gray-700 bg-black"
    >
      <input
        type="text"
        className="flex-1 px-4 py-2 border border-gray-600 bg-black text-white rounded-full focus:outline-none"
        placeholder="Type a message..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        disabled={sending}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-purple-600 text-white rounded-full disabled:opacity-50"
        disabled={sending || !messageText.trim()}
      >
        Send
      </button>
    </form>
  );
}
