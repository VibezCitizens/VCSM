import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function ChatHeader() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('conversation_members')
        .select('user_id, profiles(id, display_name, photo_url, is_online, last_seen)')
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Failed to fetch members:', error);
        return;
      }

      setMembers(data || []);
      setLoading(false);
    };

    fetchMembers();
  }, [conversationId]);

  if (loading) return null;

  // ✅ Exclude the current user from the list
  const other = members.find((m) => m.user_id !== user?.id);

  if (!other?.profiles) return null;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-neutral-800">
      <img
        src={other.profiles.photo_url || '/default.png'}
        className="w-10 h-10 rounded-full"
        alt="avatar"
      />
      <div>
        <div className="font-bold text-white">{other.profiles.display_name}</div>
        <div className="text-xs text-gray-400">
          {other.profiles.is_online
            ? 'Online'
            : `Last seen ${other.profiles.last_seen ? new Date(other.profiles.last_seen).toLocaleTimeString() : 'recently'}`}
        </div>
      </div>
    </div>
  );
}
