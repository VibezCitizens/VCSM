// src/components/ConversationList.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ConversationListItem from '@/components/ConversationListItem';

export default function ConversationList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id) return;
      setLoading(true);

      // 1. Get all conversation_ids where current user is a member
      const { data: membershipRows, error: memErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (memErr || !membershipRows?.length) {
        console.error('Error fetching memberships:', memErr);
        setLoading(false);
        return;
      }

      const convoIds = membershipRows.map((m) => m.conversation_id);

      // 2. Fetch full conversation data
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          last_message,
          last_sender_id,
          last_sent_at,
          conversation_members (
            user_id,
            muted,
            profiles (
              id,
              display_name,
              photo_url
            )
          )
        `)
        .in('id', convoIds);

      if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        return;
      }

      const sorted = data.sort((a, b) =>
        (b.last_sent_at || '').localeCompare(a.last_sent_at || '')
      );
      setConversations(sorted);
      setLoading(false);
    };

    fetchConversations();
  }, [user?.id]);

  const handleDelete = async (convoId) => {
    const confirmed = confirm('Are you sure you want to delete this conversation?');
    if (!confirmed) return;

    await supabase.from('conversations').delete().eq('id', convoId);
    setConversations((prev) => prev.filter((c) => c.id !== convoId));
    setMenuOpenId(null);
  };

  const handleMute = async (convoId) => {
    await supabase
      .from('conversation_members')
      .update({ muted: true })
      .eq('conversation_id', convoId)
      .eq('user_id', user.id);
    setMenuOpenId(null);
  };

  if (loading) {
    return <p className="text-center text-gray-400 py-4">Loading conversations...</p>;
  }

  if (conversations.length === 0) {
    return <p className="text-center text-gray-400 py-4">No conversations yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv) => (
        <ConversationListItem
          key={conv.id}
          conv={conv}
          user={user}
          navigate={navigate}
          menuOpenId={menuOpenId}
          setMenuOpenId={setMenuOpenId}
          handleMute={handleMute}
          handleDelete={handleDelete}
        />
      ))}
    </div>
  );
}
