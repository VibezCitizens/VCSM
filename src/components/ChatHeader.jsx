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

  // Exclude the current user from the list
  const other = members.find((m) => m.user_id !== user?.id);

  if (!other?.profiles) return null;

  const profile = other.profiles;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black">
      <img
        src={profile.photo_url || '/default.png'}
        alt={profile.display_name || 'User'}
        className="w-10 h-14 object-cover rounded-md shadow-sm shrink-0"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/default.png';
        }}
      />
      <div className="flex flex-col">
        <span className="text-white font-semibold leading-tight">
          {profile.display_name || 'Unknown'}
        </span>
        <span className="text-xs text-gray-400 leading-tight">
          {profile.is_online
            ? 'Online'
            : profile.last_seen
              ? `Last seen at ${new Date(profile.last_seen).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Offline'}
        </span>
      </div>
    </div>
  );
}
