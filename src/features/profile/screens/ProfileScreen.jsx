import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';
import { Plus } from 'lucide-react';
import QRCode from '@/components/QRScanHandler';
import { getOrCreatePrivateConversation } from '@/lib/getOrCreatePrivateConversation';

// **IMPORTANT: Import the ProfileHeader component**
import ProfileHeader from '@/components/ProfileHeader'; // Ensure this path is correct based on your file structure

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [posts, setPosts] = useState([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
        if (username) {
            await loadProfileByUsername(username, data.user.id);
        } else {
            await loadProfileData(data.user.id, data.user.id);
        }
      }
    };
    fetchUserAndProfile();
  }, [username]);

  const loadProfileByUsername = async (uname, currentUserId) => {
    const { data } = await supabase.from('profiles').select('*').eq('username', uname).single();
    if (data) setProfileData(data, currentUserId);
  };

  const loadProfileData = async (profileId, currentUserId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', profileId).single();
    if (data) setProfileData(data, currentUserId);
  };

  const setProfileData = async (userData, currentUserId) => {
    const { count } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', userData.id);

    let subData = null;
    if (currentUserId) {
      const { data: fetchedSubData } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('followed_id', userData.id)
        .maybeSingle();
      subData = fetchedSubData;
    }

    const { data: userPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    setProfile(userData);
    setBio(userData.bio || '');
    setDisplayName(userData.display_name || '');
    setPosts(userPosts || []);
    setSubscriberCount(count ?? 0);
    setSubscribed(!!subData);
  };

  // Callback function for ProfileHeader when photo is changed
  const handlePhotoChangeInHeader = () => {
    // When the photo is successfully uploaded and the profile updated in ProfileHeader,
    // we need to re-fetch the profile data here to update the parent component's state
    // with the new photo_url.
    if (profile?.id && currentUser?.id) {
        if (username) {
            loadProfileByUsername(username, currentUser.id);
        } else {
            loadProfileData(profile.id, currentUser.id);
        }
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), bio })
      .eq('id', profile.id);

    if (error) {
        toast.error('Failed to update profile details: ' + error.message);
        return;
    }

    if (profile?.id && currentUser?.id) {
        if (username) {
            loadProfileByUsername(username, currentUser.id);
        } else {
            loadProfileData(profile.id, currentUser.id);
        }
    }
    setEditing(false);
    toast.success('Profile updated');
    await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
  };

  const handleSubscribe = async () => {
    if (!currentUser || !profile) return;
    const { error } = await supabase.from('followers').insert({
      follower_id: currentUser.id,
      followed_id: profile.id,
    });
    if (error) {
        toast.error('Failed to subscribe: ' + error.message);
        return;
    }
    setSubscribed(true);
    setSubscriberCount((prev) => prev + 1);
  };

  const handleUnsubscribe = async () => {
    if (!currentUser || !profile) return;
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('followed_id', profile.id);
    if (error) {
        toast.error('Failed to unsubscribe: ' + error.message);
        return;
    }
    setSubscribed(false);
    setSubscriberCount((prev) => prev - 1);
  };

  const handleMessage = async () => {
    if (!currentUser || !profile || currentUser.id === profile.id) return;

    const convoId = await getOrCreatePrivateConversation(currentUser.id, profile.id);
    if (!convoId) {
      toast.error('Could not start conversation');
      return;
    }

    navigate(`/chat/${convoId}`);
  };

  const isOwnProfile = currentUser?.id === profile?.id;

  if (!profile) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* **THIS IS THE KEY CHANGE:** Render the ProfileHeader component */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onPhotoChange={handlePhotoChangeInHeader} // Pass the callback to refresh profile data
        onToggleQR={() => setQrOpen(!qrOpen)}
        qrOpen={qrOpen}
        onEdit={() => setEditing(true)}
      />

      {/* Conditional rendering for QR code if you still want it outside ProfileHeader's direct control */}
      {qrOpen && (
        <div className="mt-4 flex justify-center">
          <QRCode value={`https://vibezcitizens.com/u/${profile.username}`} size={128} />
        </div>
      )}

      {/* Editing section */}
      {editing && (
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
        </div>
      )}

      {/* Buttons for subscribe/message/friend are outside ProfileHeader, keep them here */}
      {!isOwnProfile && profile && (
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
            <button className="bg-purple-600 px-3 py-1 rounded-full text-sm">Friend</button>
        </div>
      )}

      {/* Posts section */}
      <div className="mt-6 px-4 space-y-4 pb-24">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} user={profile} />
        ))}
      </div>

      {/* Fixed Plus button for own profile */}
      {isOwnProfile && (
        <button
          onClick={() => navigate('/upload')}
          className="fixed bottom-20 right-4 bg-purple-600 text-white p-4 rounded-full shadow-xl"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}