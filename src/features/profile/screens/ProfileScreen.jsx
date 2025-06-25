import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import PostCard from '@/components/PostCard';
import { Plus } from 'lucide-react';
import QRCode from '@/components/QRScanHandler';

const R2_PUBLIC = 'https://pub-47d41a9f87d148c9a7a41a636.r2.dev';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { username } = useParams();
  const fileRef = useRef();

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
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        if (username) loadProfileByUsername(username);
        else loadProfileData(data.user.id);
      }
    });
  }, [username]);

  const loadProfileByUsername = async (uname) => {
    const { data } = await supabase.from('profiles').select('*').eq('username', uname).single();
    if (data) setProfileData(data);
  };

  const loadProfileData = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfileData(data);
  };

  const setProfileData = async (userData) => {
    const { count } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', userData.id);

    const { data: subData } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', currentUser?.id)
      .eq('followed_id', userData.id)
      .maybeSingle();

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

  const handleSave = async () => {
    if (!profile) return;
    await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), bio })
      .eq('id', profile.id);
    setProfile((prev) => ({ ...prev, display_name: displayName, bio }));
    setEditing(false);
    toast.success('Profile updated');
    await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
  };

  const uploadToCloudflare = async (file, key) => {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 600,
      useWebWorker: true,
    });
    const form = new FormData();
    form.append('file', compressed);
    form.append('key', key);
    const res = await fetch('https://upload-profile-worker.olivertrest3.workers.dev', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return `${R2_PUBLIC}/${key}`;
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const key = `profile-pictures/${profile.id}/${Date.now()}-${file.name}`;
    try {
      const url = await uploadToCloudflare(file, key);
      await supabase.from('profiles').update({ photo_url: url }).eq('id', profile.id);
      setProfile((prev) => ({ ...prev, photo_url: url }));
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser || !profile) return;
    await supabase.from('followers').insert({
      follower_id: currentUser.id,
      followed_id: profile.id,
    });
    setSubscribed(true);
    setSubscriberCount((prev) => prev + 1);
  };

  const handleUnsubscribe = async () => {
    await supabase
      .from('followers')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('followed_id', profile.id);
    setSubscribed(false);
    setSubscriberCount((prev) => prev - 1);
  };

  const handleMessage = async () => {
    if (!currentUser || !profile) return;

    const { data: convos, error } = await supabase
      .from('conversations')
      .select('id, participant_ids')
      .eq('type', 'private');

    if (error) {
      toast.error('Could not load conversations');
      return;
    }

    const existing = convos?.find(
      (c) =>
        Array.isArray(c.participant_ids) &&
        c.participant_ids.includes(currentUser.id) &&
        c.participant_ids.includes(profile.id) &&
        c.participant_ids.length === 2
    );

    if (existing) {
      navigate(`/chat/${existing.id}`);
      return;
    }

    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        type: 'private',
        participant_ids: [currentUser.id, profile.id],
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (createError || !created) {
      toast.error('Could not start new conversation');
      return;
    }

    navigate(`/chat/${created.id}`);
  };

  const isOwnProfile = currentUser?.id === profile?.id;

  return (
    <div className="bg-black text-white min-h-screen">
      {profile && (
        <div className="text-center p-6">
          <div className="relative group mx-auto w-36 h-24">
            <img
              src={profile.photo_url || '/default-avatar.png'}
              alt="avatar"
              className="w-36 h-24 rounded-xl object-cover border border-neutral-700 shadow-sm"
            />
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  onChange={handlePhotoChange}
                  hidden
                />
                <button
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 text-xs text-white"
                  onClick={() => fileRef.current.click()}
                >
                  Change
                </button>
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold mt-3">{displayName}</h1>
          <p className="text-gray-400 mt-1">{bio}</p>
          <p className="mt-2 text-sm text-purple-300">Subscribers: {subscriberCount}</p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {isOwnProfile ? (
              <button
                onClick={() => setEditing(true)}
                className="bg-purple-600 px-4 py-1 rounded-full text-sm"
              >
                Edit Profile
              </button>
            ) : (
              <>
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
              </>
            )}
            <button
              onClick={() => setQrOpen(!qrOpen)}
              className="bg-purple-600 px-3 py-1 rounded-full text-sm"
            >
              {qrOpen ? 'Hide QR' : 'Show QR'}
            </button>
          </div>

          {qrOpen && (
            <div className="mt-4 flex justify-center">
              <QRCode value={`https://vibezcitizens.com/u/${profile.username}`} size={128} />
            </div>
          )}

          {editing && (
            <div className="mt-4 space-y-2 text-left max-w-sm mx-auto">
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
        </div>
      )}

      <div className="mt-6 px-4 space-y-4 pb-24">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} user={profile} />
        ))}
      </div>

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
