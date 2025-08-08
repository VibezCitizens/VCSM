// src/components/ChatHeader.jsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function ChatHeader() {
  const { user } = useAuth();
  const { id: conversationId } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('safe_conversation_members_with_profiles')
        .select('*')
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('[ChatHeader] Failed to fetch members:', error);
      } else {
        setMembers(data || []);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [conversationId]);

  if (loading || !user?.id) return null;

  const other = members.find(m => m.user_id !== user.id);
  if (!other) return null;

  const displayName = other.display_name || other.username || 'Unknown';
  const avatarUrl = other.photo_url || '/default.png';
  const lastSeenText = other.is_online
    ? 'Online'
    : other.last_seen
    ? `Last seen at ${new Date(other.last_seen).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'Offline';

  return (
    <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black">
      <img
        src={avatarUrl}
        alt={displayName}
        className="w-10 h-10 rounded-full object-cover shadow-sm"
        onError={e => { e.currentTarget.src = '/default.png'; }}
      />
      <div className="flex flex-col">
        <span className="text-white font-semibold">{displayName}</span>
        <span className="text-xs text-gray-400">{lastSeenText}</span>
      </div>
    </div>
  );
}
