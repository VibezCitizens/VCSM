// src/features/chat/components/ConversationList.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { MoreVertical, Trash2, BellOff } from 'lucide-react';

export default function ConversationList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null); // track open menu

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
          conversation_members ( user_id )
        `)
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
      {conversations.map((conv) => {
        const otherMember = conv.conversation_members.find((m) => m.user_id !== user.id);
        const profile = otherMember?.profile;
        const displayName = profile?.display_name || 'Unknown User';
        const avatar = profile?.photo_url || '/default-avatar.png';

        return (
          <div
            key={conv.id}
            className="relative flex items-center justify-between gap-3 p-4 hover:bg-neutral-800 border-b border-neutral-700"
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/chat/${conv.id}`)}
            >
              <img
                src={avatar}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm">{displayName}</span>
                <span className="text-gray-400 text-xs truncate max-w-[200px]">
                  {conv.last_message || 'No messages yet.'}
                </span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
                className="p-1 hover:bg-neutral-700 rounded"
              >
                <MoreVertical size={18} />
              </button>

              {menuOpenId === conv.id && (
                <div className="absolute right-0 top-6 bg-neutral-900 rounded shadow-md z-50 w-32 border border-neutral-700">
                  <button
                    onClick={() => handleMute(conv.id)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800"
                  >
                    <BellOff size={14} className="inline mr-2" />
                    Mute
                  </button>
                  <button
                    onClick={() => handleDelete(conv.id)}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-neutral-800"
                  >
                    <Trash2 size={14} className="inline mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
