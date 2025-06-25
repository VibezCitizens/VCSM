import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';

export default function ChatScreen() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(display_name, photo_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    const sub = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new;

          const { data: senderProfile, error: profileError } = await supabase
            .from('profiles')
            .select('display_name, photo_url')
            .eq('id', newMsg.sender_id)
            .single();

          const msgWithSender = {
            ...newMsg,
            sender: profileError ? null : senderProfile,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === msgWithSender.id)) return prev;
            return [...prev, msgWithSender];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text: text.trim(),
        ciphertext: '',
        iv: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Send error:', error);
      return;
    }

    // Immediately append message to UI
    setMessages((prev) => [
      ...prev,
      {
        ...data,
        sender: {
          display_name: user.user_metadata?.display_name || 'You',
          photo_url: user.user_metadata?.photo_url || '/default-avatar.png',
        },
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      <div className="p-4 text-white text-lg font-semibold border-b border-neutral-700">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {loading ? (
          <p className="text-gray-400 text-sm text-center mt-4">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-4">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user.id}
              sender={msg.sender}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-neutral-700 bg-neutral-800">
        <MessageInput
          onSend={handleSend}
          conversationId={conversationId}
          currentUser={user}
        />
      </div>
    </div>
  );
}
