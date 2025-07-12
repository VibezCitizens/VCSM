import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

import ProfileHeader from '@/components/ProfileHeader';
import { getOrCreatePrivateConversation } from '@/lib/getOrCreatePrivateConversation';

import PostList from '@/features/profile/tabs/PostList';
import PhotoGrid from '@/features/profile/tabs/PhotoGrid';
import VideoFeed from '@/features/profile/tabs/VideoFeed';
import FriendsList from '@/features/profile/tabs/FriendsList';
import FriendsListEditor from '@/features/profile/tabs/FriendsListEditor';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { username: urlUsername, userId: urlUserId } = useParams();

  const [currentUser, setCurrentUser] = useState(undefined);
  const [profileData, setProfileData] = useState(null);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [posts, setPosts] = useState([]);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('POST');

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user || null;
      setCurrentUser(user);

      if (!user) {
        setError('Please log in to view profiles.');
        setLoading(false);
        return;
      }

      if (!urlUsername && !urlUserId && user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (profileError || !userProfile?.username) {
          setError('Your profile username could not be found. Please update your profile.');
          setLoading(false);
          return;
        }

        navigate(`/u/${userProfile.username}`, { replace: true });
        return;
      }

      setLoading(false);
    };

    checkAuthAndRedirect();
  }, [navigate, urlUsername, urlUserId]);

  const fetchAndSetProfileData = useCallback(async (identifier, type, currentUserId) => {
    setLoading(true);
    setError(null);
    setProfileData(null);

    try {
      let query = supabase.from('profiles').select('*');

      if (type === 'username') {
        query = query.eq('username', identifier);
      } else if (type === 'userId') {
        const isUUID = /^[0-9a-fA-F-]{36}$/.test(identifier);
        if (!isUUID) {
          setLoading(false);
          return;
        }
        query = query.eq('id', identifier);
      } else {
        setLoading(false);
        return;
      }

      const { data: userData, error: profileError } = await query.single();
      if (profileError || !userData) {
        setError(profileError?.message || 'Profile not found.');
        setLoading(false);
        return;
      }

      const { data: subscriberRows, count: fetchedSubscriberCount } = await supabase
        .from('followers')
        .select('follower_id, profiles!fk_follower(display_name, photo_url, username)', { count: 'exact' })
        .eq('followed_id', userData.id);

      const subscribers = (subscriberRows || []).map(row => row.profiles).filter(Boolean);

      let isSubscribed = false;
      if (currentUserId && currentUserId !== userData.id) {
        const { data: subData } = await supabase
          .from('followers')
          .select('id')
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
      if (import.meta.env.DEV) console.error('[ProfileScreen] Unexpected fetch error:', err);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser !== undefined) {
      if (urlUsername) {
        fetchAndSetProfileData(urlUsername, 'username', currentUser?.id);
      } else if (urlUserId) {
        fetchAndSetProfileData(urlUserId, 'userId', currentUser?.id);
      } else if (currentUser) {
        // This will likely never hit since we redirect `/me` earlier
        if (import.meta.env.DEV) console.warn('[ProfileScreen] No profile identifier found in URL.');
      }
    }
  }, [urlUsername, urlUserId, currentUser, fetchAndSetProfileData]);

  const refreshProfile = useCallback(() => {
    if (urlUsername) {
      fetchAndSetProfileData(urlUsername, 'username', currentUser?.id);
    } else if (urlUserId) {
      fetchAndSetProfileData(urlUserId, 'userId', currentUser?.id);
    } else if (currentUser) {
      fetchAndSetProfileData(currentUser.id, 'userId', currentUser.id);
    }
  }, [urlUsername, urlUserId, currentUser, fetchAndSetProfileData]);

  const handleMessage = async () => {
    if (!currentUser || !profileData || currentUser.id === profileData.id) return;
    const convoId = await getOrCreatePrivateConversation(currentUser.id, profileData.id);
    convoId ? navigate(`/chat/${convoId}`) : toast.error('Failed to start chat.');
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
        isOwnProfile={isOwnProfile}
        onPhotoChange={refreshProfile}
      />

      <div className="sticky top-0 z-10 bg-black border-b border-neutral-800 flex justify-around text-xs font-semibold mt-4">
        {['POST', 'PHOTOS', 'VIDEOS', 'FRIENDS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 ${
              activeTab === tab
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4 px-4 pb-24 space-y-4">
        {activeTab === 'POST' && <PostList posts={posts} user={profileData} />}
        {activeTab === 'PHOTOS' && <PhotoGrid posts={posts} />}
        {activeTab === 'VIDEOS' && <VideoFeed posts={posts} />}
        {activeTab === 'FRIENDS' &&
          (isOwnProfile
            ? <FriendsListEditor userId={profileData.id} />
            : <FriendsList userId={profileData.id} />
          )
        }
      </div>
    </div>
  );
}
