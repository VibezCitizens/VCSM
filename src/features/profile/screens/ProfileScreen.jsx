import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';
import QRCode from 'react-qr-code';
import QRScanHandler from '@/components/QRScanHandler'; // Assuming this is used elsewhere or for future features
import { getOrCreatePrivateConversation } from '@/lib/getOrCreatePrivateConversation';
import ProfileHeader from '@/components/ProfileHeader';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { username } = useParams(); // This will be undefined for /me route, and the username for /u/:username

  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null); // Renamed from 'profile' to avoid confusion with the setProfileData function
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [posts, setPosts] = useState([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  // Helper function to fetch profile and related data
  // Use useCallback to memoize this function, preventing unnecessary re-renders when passed down
  const fetchAndSetProfileData = useCallback(async (profileToLoad, currentUserId) => {
    if (!profileToLoad) {
      setProfileData(null);
      setPosts([]);
      setSubscriberCount(0);
      setSubscribed(false);
      return;
    }

    try {
      const { data: userData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq(typeof profileToLoad === 'string' ? 'username' : 'id', profileToLoad)
        .maybeSingle(); // Use maybeSingle for robustness

      if (profileError || !userData) {
        setError(profileError?.message || 'Profile not found.');
        setLoading(false);
        setProfileData(null);
        return;
      }

      // Fetch subscriber count
      const { count: fetchedSubscriberCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', userData.id);

      // Check subscription status
      let isSubscribed = false;
      if (currentUserId) {
        const { data: fetchedSubData } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', currentUserId)
          .eq('followed_id', userData.id)
          .maybeSingle();
        isSubscribed = !!fetchedSubData;
      }

      // Fetch user's posts
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (postsError) {
        toast.error('Failed to load posts: ' + postsError.message);
        // Continue displaying profile even if posts fail
      }

      setProfileData({ ...userData, subscriber_count: fetchedSubscriberCount ?? 0 });
      setBio(userData.bio || '');
      setDisplayName(userData.display_name || '');
      setPosts(userPosts || []);
      setSubscriberCount(fetchedSubscriberCount ?? 0);
      setSubscribed(isSubscribed);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError('An unexpected error occurred while loading profile.');
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies for fetchAndSetProfileData itself, as its arguments provide dynamism

  // Main useEffect to load profile based on URL or current user
  useEffect(() => {
    setLoading(true); // Set loading true on every username or currentUser change
    setError(null);   // Clear error on new load attempt

    const authenticateAndLoad = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const authenticatedUser = authData?.user;
      setCurrentUser(authenticatedUser);

      if (username) {
        // If username exists in URL, load that profile
        await fetchAndSetProfileData(username, authenticatedUser?.id);
      } else if (authenticatedUser) {
        // If no username in URL, but user is logged in, load current user's profile
        await fetchAndSetProfileData(authenticatedUser.id, authenticatedUser.id);
      } else {
        // No username in URL and no logged-in user - handle as you deem appropriate (e.g., redirect to login)
        // For now, it will show "Profile not found." if profileData remains null
        setLoading(false);
        setProfileData(null);
        setError("Please log in to view your profile.");
      }
    };

    authenticateAndLoad();
  }, [username, fetchAndSetProfileData]); // Dependency on username and the memoized fetch function

  // Function to refresh profile data (e.g., after photo change or save)
  const refreshProfile = useCallback(() => {
    if (profileData?.id && currentUser?.id) {
      if (username) {
        fetchAndSetProfileData(username, currentUser.id);
      } else {
        fetchAndSetProfileData(currentUser.id, currentUser.id);
      }
    } else if (username) {
       // If no current user, but a username is in the URL, try fetching that public profile
       fetchAndSetProfileData(username, null);
    }
  }, [profileData, currentUser, username, fetchAndSetProfileData]);


  const handleSave = async () => {
    if (!profileData || !currentUser || profileData.id !== currentUser.id) {
      toast.error('You can only edit your own profile.');
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), bio })
      .eq('id', profileData.id);

    if (updateError) {
      toast.error('Failed to update profile details: ' + updateError.message);
      return;
    }

    toast.success('Profile updated');
    setEditing(false);
    // Refresh the profile data after a successful save
    refreshProfile();
    // Also update Supabase auth user metadata if display_name is part of it
    await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
  };

  const handleSubscribe = async () => {
    if (!currentUser || !profileData) return;
    if (currentUser.id === profileData.id) {
        toast.error("You cannot subscribe to your own profile.");
        return;
    }
    const { error: subscribeError } = await supabase.from('followers').insert({
      follower_id: currentUser.id,
      followed_id: profileData.id,
    });
    if (subscribeError) {
      toast.error('Failed to subscribe: ' + subscribeError.message);
      return;
    }
    setSubscribed(true);
    setSubscriberCount((prev) => prev + 1);
    toast.success(`Subscribed to ${profileData.display_name || profileData.username}!`);
  };

  const handleUnsubscribe = async () => {
    if (!currentUser || !profileData) return;
    const { error: unsubscribeError } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('followed_id', profileData.id);
    if (unsubscribeError) {
      toast.error('Failed to unsubscribe: ' + unsubscribeError.message);
      return;
    }
    setSubscribed(false);
    setSubscriberCount((prev) => prev - 1);
    toast.success(`Unsubscribed from ${profileData.display_name || profileData.username}.`);
  };

  const handleMessage = async () => {
    if (!currentUser || !profileData || currentUser.id === profileData.id) {
        toast.error('Cannot message yourself or invalid profile.');
        return;
    }
    const convoId = await getOrCreatePrivateConversation(currentUser.id, profileData.id);
    if (!convoId) {
      toast.error('Could not start conversation');
      return;
    }
    navigate(`/chat/${convoId}`);
  };

  const isOwnProfile = currentUser?.id === profileData?.id;

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading profile...
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
        profile={{ ...profileData, subscriber_count: subscriberCount }} // Pass subscriberCount from state
        isOwnProfile={isOwnProfile}
        onPhotoChange={refreshProfile} // Use the new refreshProfile for consistency
        onToggleQR={() => setQrOpen(!qrOpen)}
        qrOpen={qrOpen}
        onEdit={() => setEditing((prev) => !prev)}
      />

      {qrOpen && (
        <div className="mt-4 flex justify-center">
          <QRCode value={`https://vibezcitizens.com/u/${profileData.username}`} size={128} />
        </div>
      )}

      {editing && isOwnProfile && ( // Ensure only own profile can be edited
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
          <button
            onClick={handleSave}
            className="w-full bg-purple-600 text-white py-2 rounded"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="w-full bg-neutral-700 text-white py-2 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {!isOwnProfile && profileData && currentUser && ( // Only show interaction buttons if not own profile AND current user exists
        <div className="mt-3 flex flex-wrap justify-center gap-2 p-4">
          <button
            onClick={subscribed ? handleUnsubscribe : handleSubscribe}
            className="bg-purple-600 px-3 py-1 rounded-full text-sm"
          >
            {subscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
          <button
            onClick={handleMessage}
            className="bg-purple-600 px-3 py-1 rounded-full text-sm"
          >
            Message
          </button>
          {/* Add a "Friend" button if you have friend functionality, but ensure it's distinct from subscribe */}
          <button className="bg-purple-600 px-3 py-1 rounded-full text-sm">Friend</button>
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

      {/* If QRScanHandler is meant for something else or a future feature, keep it. */}
      {/* If it's part of a QR code scanning feature not directly tied to profile display,
          you might render it conditionally or in a different part of your app. */}
      {/* <QRScanHandler /> */}
    </div>
  );
}