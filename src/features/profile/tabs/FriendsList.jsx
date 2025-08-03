import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserLink from '@/components/UserLink';

export default function FriendsList({ userId }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const { data: following } = await supabase
          .from('followers')
          .select('followed_id')
          .eq('follower_id', userId);

        const { data: followers } = await supabase
          .from('followers')
          .select('follower_id')
          .eq('followed_id', userId);

        const followingIds = following.map(f => f.followed_id);
        const followerIds = followers.map(f => f.follower_id);

        const mutualIds = followingIds.filter(id => followerIds.includes(id));

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, photo_url')
          .in('id', mutualIds);

        setFriends(profiles || []);
      } catch (err) {
        console.error('Error loading friends:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchFriends();
  }, [userId]);

  if (loading) {
    return <p className="text-center text-neutral-500">Loading friends...</p>;
  }

  if (friends.length === 0) {
    return <p className="text-center text-neutral-500">No mutual friends yet.</p>;
  }

  return (
    <div className="space-y-3">
      {friends.map(friend => (
        <UserLink
          key={friend.id}
          user={friend}
          avatarSize="w-10 h-10"
          avatarShape="rounded" // circle
          textSize="text-sm"
          withUsername={true}
        />
      ))}
    </div>
  );
}