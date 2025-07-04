import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';
import QRCode from 'react-qr-code';
import { getOrCreatePrivateConversation } from '@/lib/getOrCreatePrivateConversation';
import ProfileHeader from '@/components/ProfileHeader';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [currentUser, setCurrentUser] = useState(undefined);
  const [profileData, setProfileData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [posts, setPosts] = useState([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user || null;
        setCurrentUser(user);

        if (!user) {
          setError('Please log in to view your profile.');
          setLoading(false);
          return;
        }

        if (!username) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

          if (profileError || !profileData?.username) {
            setError('Your profile could not be found.');
            setLoading(false);
            return;
          }

          navigate(`/u/${profileData.username}`, { replace: true });
        }
      } catch (err) {
        console.error(err);
        setError('Unexpected error during initialization.');
        setLoading(false);
      }
    };

    initialize();
  }, [username, navigate]);

  const fetchAndSetProfileData = useCallback(async (identifier, currentUserId) => {
    setLoading(true);
    setError(null);
    setProfileData(null);

    try {
      let query = supabase.from('profiles').select('*');
      query = typeof identifier === 'string'
        ? query.eq('username', identifier)
        : query.eq('id', identifier);

      const { data: userData, error: profileError } = await query.single();

      if (profileError || !userData) {
        setError(profileError?.message || 'Profile not found.');
        return;
      }

      const { data: subscriberRows, count: fetchedSubscriberCount } = await supabase
        .from('followers')
        .select('follower_id, profiles:profiles!follower_id(*)', { count: 'exact' })
        .eq('followed_id', userData.id);

      const subscribers = (subscriberRows || []).map(row => row.profiles).filter(Boolean);

      let isSubscribed = false;
      if (currentUserId) {
        const { data: subData } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', currentUserId)
          .eq('followed_id', userData.id)
          .maybeSingle();
        isSubscribed = !!subData;
      }

      const { data: userPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      setProfileData({
        ...userData,
        subscriber_count: fetchedSubscriberCount ?? 0,
        subscribers,
      });

      setBio(userData.bio || '');
      setDisplayName(userData.display_name || '');
      setPosts(userPosts || []);
      setSubscriberCount(fetchedSubscriberCount ?? 0);
      setSubscribed(isSubscribed);
    } catch (err) {
      console.error("Unexpected profile fetch error:", err);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && username) {
      fetchAndSetProfileData(username, currentUser.id);
    }
  }, [username, currentUser, fetchAndSetProfileData]);

  const refreshProfile = useCallback(() => {
    if (username) {
      fetchAndSetProfileData(username, currentUser?.id);
    } else if (currentUser) {
      fetchAndSetProfileData(currentUser.id, currentUser.id);
    }
  }, [username, currentUser, fetchAndSetProfileData]);

  const handleSave = async () => {
    if (!profileData || !currentUser || profileData.id !== currentUser.id) {
      toast.error('You can only edit your own profile.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), bio })
      .eq('id', profileData.id);

    if (error) {
      toast.error('Failed to update: ' + error.message);
      return;
    }

    toast.success('Profile updated');
    setEditing(false);
    refreshProfile();
    await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
  };

  const handleSubscribe = async () => {
    if (!currentUser || !profileData) return;
    if (currentUser.id === profileData.id) {
      toast.error("You can't subscribe to yourself.");
      return;
    }

    const { error } = await supabase.from('followers').insert({
      follower_id: currentUser.id,
      followed_id: profileData.id,
    });

    if (error) {
      toast.error('Failed to subscribe: ' + error.message);
      return;
    }

    setSubscribed(true);
    setSubscriberCount((prev) => prev + 1);
  };

  const handleUnsubscribe = async () => {
    if (!currentUser || !profileData) return;

    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('followed_id', profileData.id);

    if (error) {
      toast.error('Failed to unsubscribe: ' + error.message);
      return;
    }

    setSubscribed(false);
    setSubscriberCount((prev) => prev - 1);
  };

  const handleMessage = async () => {
    if (!currentUser || !profileData || currentUser.id === profileData.id) return;

    const convoId = await getOrCreatePrivateConversation(currentUser.id, profileData.id);
    if (convoId) navigate(`/chat/${convoId}`);
  };

  const isOwnProfile = currentUser?.id === profileData?.id;

  if (currentUser === undefined || loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <ProfileHeader
        profile={{ ...profileData, subscriber_count: subscriberCount }}
        subscribers={profileData?.subscribers || []}
        isOwnProfile={isOwnProfile}
        onPhotoChange={refreshProfile}
        onToggleQR={() => setQrOpen(!qrOpen)}
        qrOpen={qrOpen}
        onEdit={() => setEditing((prev) => !prev)}
      />

      {qrOpen && (
        <div className="mt-4 flex justify-center">
          <QRCode value={`https://vibezcitizens.com/u/${profileData.username}`} size={128} />
        </div>
      )}

      {editing && isOwnProfile && (
        <div className="mt-4 space-y-2 text-left max-w-sm mx-auto p-4">
          <input
            className="w-full px-3 py-2 rounded bg-neutral-800 text-white"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
          />
          <textarea
            className="w-full px-3 py-2 rounded bg-neutral-800 text-white"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
          />
          <button onClick={handleSave} className="w-full bg-purple-600 text-white py-2 rounded">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="w-full bg-neutral-700 text-white py-2 rounded">
            Cancel
          </button>
        </div>
      )}

      {!isOwnProfile && currentUser && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 p-4">
          <button onClick={subscribed ? handleUnsubscribe : handleSubscribe} className="bg-purple-600 px-3 py-1 rounded-full text-sm">
            {subscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
          <button onClick={handleMessage} className="bg-purple-600 px-3 py-1 rounded-full text-sm">
            Message
          </button>
        </div>
      )}

      <div className="mt-6 px-4 space-y-4 pb-24">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} user={profileData} />
          ))
        ) : (
          <p className="text-center text-neutral-500">No posts found.</p>
        )}
      </div>
    </div>
  );
}
