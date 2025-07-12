// (Your unchanged imports remain)
import { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { getOrCreatePrivateConversation } from '@/lib/getOrCreatePrivateConversation';
import VisibleQRCode from './VisibleQRCode';

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange,
}) {
  const navigate = useNavigate();
  const fileRef = useRef();
  const { user } = useAuth();

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(profile?.subscriber_count || 0);
  const [subscriberList, setSubscriberList] = useState([]);
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);

  const {
    id: profileId,
    display_name: profileDisplayName,
    bio: profileBio,
    photo_url: profilePhotoUrl,
  } = profile || {};

  const isProfileIdValid = profileId && /^[0-9a-fA-F-]{36}$/.test(profileId);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ displayName: '', bio: '' });

  useEffect(() => {

    if (profile) {
      setEditFormData({
        displayName: profile.display_name || '',
        bio: profile.bio || '',
      });
      setSubscriberCount(profile.subscriber_count || 0);
    }
  }, [profile, profileId, user?.id, isOwnProfile]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id || !profile?.id || user.id === profile.id) return;
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('followed_id', profile.id)
        .maybeSingle();
      if (!error) setIsSubscribed(!!data);
    };
    checkSubscription();
  }, [user?.id, profile?.id]);

  const handleSubscribe = async () => {
    if (!user?.id || !profile?.id || user.id === profile.id) return;
    try {
      if (isSubscribed) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', profile.id);
        setIsSubscribed(false);
        setSubscriberCount((prev) => Math.max(prev - 1, 0));
      } else {
        await supabase.from('followers').insert([
          { follower_id: user.id, followed_id: profile.id },
        ]);
        setIsSubscribed(true);
        setSubscriberCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
      toast.error('Subscription failed.');
    }
  };

  const handleMessage = async () => {
    if (!user?.id || !profile?.id || user.id === profile.id) return;
    const convoId = await getOrCreatePrivateConversation(user.id, profile.id);
    if (convoId) {
      navigate(`/chat/${convoId}`);
    } else {
      toast.error('Failed to start chat.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!isProfileIdValid) {
      toast.error('Profile ID invalid.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      const key = `profile-pictures/${profileId}.jpg`;
      const { url: photoUrl, error: uploadError } = await uploadToCloudflare(compressed, key);

      if (uploadError || !photoUrl) throw new Error('Upload failed.');

      const { error: supabaseError } = await supabase
        .from('profiles')
        .update({ photo_url: photoUrl })
        .eq('id', profileId);

      if (supabaseError) throw new Error(supabaseError.message);

      toast.success('Profile photo updated!');
      onPhotoChange?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!profileId || !editFormData.displayName.trim()) {
      toast.error('Invalid form data.');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editFormData.displayName,
          bio: editFormData.bio,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('Profile updated!');
      setIsEditing(false);
      onPhotoChange?.();
    } catch (err) {
      toast.error(err.message || 'Update failed.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      displayName: profileDisplayName || '',
      bio: profileBio || '',
    });
  };

  const loadSubscribers = async () => {
  
    const { data, error } = await supabase
      .from('followers')

      .select('follower_id, profiles!fk_follower(display_name, photo_url, username)')
      .eq('followed_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading subscribers:', error);
      return toast.error('Failed to load subscribers.');
    }

  
    setSubscriberList(data);

  };

  const qrCodeValue = profileId ? `${window.location.origin}/u/${profileId}` : '';

  useEffect(() => {

  }, [showSubscriberModal, subscriberList.length]);


  return (
    <>
      <div className="bg-neutral-900 rounded-xl mx-4 mt-6 p-5 flex items-center justify-between shadow-md min-h-[140px]">
        <div className="flex flex-col justify-center space-y-2 text-left max-w-[70%]">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                type="text"
                name="displayName"
                value={editFormData.displayName}
                onChange={handleEditChange}
                placeholder="Display Name"
                className="text-sm px-3 py-2 bg-neutral-800 text-white rounded w-full"
              />
              <textarea
                name="bio"
                value={editFormData.bio}
                onChange={handleEditChange}
                placeholder="Bio"
                rows="2"
                className="text-sm px-3 py-2 bg-neutral-800 text-white rounded resize-y w-full"
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleCancelEdit} className="text-sm text-neutral-400 hover:underline">Cancel</button>
                <button type="submit" className="text-sm text-purple-500 hover:underline">Save</button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white">{profileDisplayName || 'Unnamed'}</h1>
              <p className="text-sm text-neutral-300">{profileBio || 'No bio yet.'}</p>

              {typeof subscriberCount === 'number' && (
                <button
                  className="text-sm text-purple-400 text-left hover:underline"
                  onClick={() => {
                    if (isOwnProfile) {
                      loadSubscribers();
                      setShowSubscriberModal(true);
                     
                    }
                  }}
                >
                  {subscriberCount} Subscriber{subscriberCount !== 1 && 's'}
                </button>
              )}

              {isOwnProfile ? (
                <div className="flex gap-3 mt-1">
                  <button onClick={() => setQrCodeModalOpen(true)} className="text-sm text-purple-400 hover:underline">Show QR</button>
                  <button onClick={() => setIsEditing(true)} className="text-sm text-purple-400 hover:underline">Edit Profile</button>
                </div>
              ) : (
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={handleSubscribe}
                    className="bg-purple-600 text-white rounded-xl px-4 py-1 text-sm hover:bg-purple-700 transition-colors"
                  >
                    {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="bg-neutral-800 text-white rounded-xl px-4 py-1 text-sm hover:bg-neutral-700 transition-colors"
                  >
                    Message
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="relative group w-24 h-24 shrink-0 ml-4">
          <img
            src={profilePhotoUrl || '/default-avatar.png'}
            alt={profileDisplayName || 'User avatar'}
            className="w-full h-full object-cover rounded-xl border border-neutral-700"
          />
          {isOwnProfile && (
            <>
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileRef}
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto || !isProfileIdValid}
              />
              <button
                type="button"
                onClick={() => !isUploadingPhoto && fileRef.current?.click()}
                className={`absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs rounded-xl ${
                  isUploadingPhoto ? 'cursor-not-allowed' : 'hover:opacity-100 opacity-0 group-hover:opacity-100'
                } transition-opacity duration-200`}
              >
                {isUploadingPhoto ? 'Uploading...' : 'Change'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal to show subscribers */}
      {isOwnProfile && showSubscriberModal && subscriberList.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowSubscriberModal(false)}
        >
          <div
            className="bg-neutral-900 rounded-xl p-6 max-w-sm w-full text-white overflow-y-auto max-h-[70vh] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3 text-purple-400">Your Subscribers</h3>
            <ul className="space-y-2 list-none">
              {subscriberList.map((s) => (
                <li key={s.follower_id}>
                  {s.profiles?.username ? ( // Conditional rendering based on username existence
                    <Link
                      to={`/u/${s.profiles.username}`} // ✅ CORRECTED: Use s.profiles.username
                      onClick={() => setShowSubscriberModal(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors duration-200 no-underline hover:underline"
                    >
                      <img
                        src={s.profiles?.photo_url || '/default-avatar.png'}
                        className="w-7 h-7 rounded object-cover"
                        alt={s.profiles?.display_name || 'User avatar'}
                      />
                      <span>{s.profiles?.display_name || 'Unnamed'}</span>
                    </Link>
                  ) : (
                    // Fallback for users without a username, if you wish to display them
                    // This will not be clickable, or you could make it link to /profile/:userId
                    <div className="flex items-center gap-3 p-2 text-neutral-500">
                      <img
                        src={s.profiles?.photo_url || '/default-avatar.png'}
                        className="w-7 h-7 rounded object-cover"
                        alt={s.profiles?.display_name || 'User avatar'}
                      />
                      <span>{s.profiles?.display_name || 'Unnamed'} (No Username)</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowSubscriberModal(false)}
              className="mt-4 text-sm text-purple-400 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrCodeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setQrCodeModalOpen(false)}
        >
          <div
            className="bg-neutral-900 rounded-lg p-6 w-full max-w-xs text-white relative flex flex-col items-center gap-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2">Scan My Profile</h2>
            {qrCodeValue ? (
              <div className="p-2 bg-white rounded-md">
                <VisibleQRCode value={qrCodeValue} size={200} />
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Loading QR code...</p>
            )}
            <button
              type="button"
              onClick={() => setQrCodeModalOpen(false)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}