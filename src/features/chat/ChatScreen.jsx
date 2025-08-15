// src/features/chat/ChatScreen.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ChatHeader from '@/components/ChatHeader';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

const BOTTOM_NAV_H = 56;   // px – adjust if you have a fixed bottom nav
const INPUT_H = 64;        // px – approximate input bar height

export default function ChatScreen() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Load history
    supabase
      .from('messages')
      .select('id, content, sender_id, created_at, media_url, media_type, conversation_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error loading messages:', error);
        else setMessages(data || []);
        setLoading(false);
      });

    // Live updates
    const sub = supabase
      .channel(`msg-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        ({ new: msg }) => setMessages(prev => [...prev, msg])
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [conversationId, user]);

  if (!user) return <p>Loading user…</p>;
  if (loading) return <p>Loading messages…</p>;

  const handleNewMessage = (msg) => setMessages(prev => [...prev, msg]);

  return (
    // Fill the viewport reliably (mobile-safe with 100dvh)
    <div className="flex h-[100dvh] flex-col bg-black text-white">
      {/* 1) Header (natural height) */}
      <ChatHeader />

      {/* 2) Messages area takes remaining height and scrolls */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          // keep last message visible above input+bottom nav
          paddingBottom: `${INPUT_H + BOTTOM_NAV_H + 16}px`,
        }}
      >
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} currentUserId={user.id} />
        ))}
      </div>

      {/* 3) Input bar pinned at the very bottom (no absolute!) */}
      <div
        className="border-t border-neutral-800 bg-black/90 backdrop-blur-md"
        style={{
          paddingBottom: `calc(25px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="mx-auto max-w-screen-md px-3 py-3" style={{ height: INPUT_H }}>
          <MessageInput conversationId={conversationId} onSend={handleNewMessage} />
        </div>
      </div>

      {/* If you truly have a fixed bottom nav rendered elsewhere, keep BOTTOM_NAV_H accurate.
         If not, set BOTTOM_NAV_H = 0 above. */}
    </div>
  );
}
