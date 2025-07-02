// src/features/chat/ConversationList.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

// **CORRECTED IMPORT PATH for ConversationListItem based on your file structure**
import ConversationListItem from '@/components/ConversationListItem';
// If '@/components' doesn't work, try a relative path like:
// import ConversationListItem from '../../components/ConversationListItem';


// Removed direct lucide-react imports from here as they are now in ConversationListItem.jsx
// import { MoreVertical, Trash2, BellOff } from 'lucide-react';

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

      const { data: rawConvos, error } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          last_message,
          last_sender_id,
          last_sent_at,
          conversation_members!inner (
            user_id,
            muted
          )
        `)
        .eq('conversation_members.user_id', user.id)
        .order('last_sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        return;
      }

      const allUserIds = [
        ...new Set(rawConvos.flatMap((c) => c.conversation_members.map((m) => m.user_id))),
      ];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, photo_url')
        .in('id', allUserIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        setLoading(false);
        return;
      }

      const profileMap = {};
      for (const p of profiles) profileMap[p.id] = p;

      const withProfiles = rawConvos.map((c) => ({
        ...c,
        conversation_members: c.conversation_members.map((m) => ({
          ...m,
          profile: profileMap[m.user_id] || null,
         })),
      }));

      setConversations(withProfiles);
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