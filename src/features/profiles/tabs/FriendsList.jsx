// src/features/profile/FriendsList.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserLink from '@/components/UserLink';

export default function FriendsList({ userId, isPrivate = false }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('list_user_friends', { target: userId });
        if (error) throw error;
        if (!cancelled) setFriends(data || []);
      } catch (err) {
        console.error('FriendsList load error:', err);
        if (!cancelled) setFriends([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return <p className="text-center text-neutral-500">Loading friends...</p>;

  if (friends.length === 0) {
    // The RPC returns empty when user has 0 friends OR you’re not allowed to see them.
    return (
      <p className="text-center text-neutral-500">
        {isPrivate ? 'Friends are hidden for this private profile.' : 'No friends yet.'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <UserLink
          key={friend.id}
          user={friend}
          avatarSize="w-10 h-10"
          avatarShape="rounded"
          textSize="text-sm"
          withUsername
        />
      ))}
    </div>
  );
}
