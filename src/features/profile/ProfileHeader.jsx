// src/features/profile/ProfileHeader.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getOrCreatePrivateConversation } from '@/utils/conversations';
import VisibleQRCode from '@/features/profile/components/VisibleQRCode';

import StartAsVportButton from '@/features/chat/components/StartAsVportButton';
import SocialButtons from '@/components/SocialButtons';

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange,   // optional: parent refresh callback
  onMessage,       // optional: custom message handler
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);
  const { user } = useAuth();
  const { identity } = useIdentity();

  // ---- Derived props
  const {
    id: profileId,
    display_name: profileDisplayName,
    bio: profileBio,
    photo_url: profilePhotoUrl,
    username: profileUsername,
    kind: profileKind,
  } = profile || {};

  const isVport = profileKind === 'vport';
  const isProfileIdValid = !!profileId && /^[0-9a-fA-F-]{36}$/.test(profileId);
  const isActingAsVport = identity?.type === 'vport' && !!identity?.vportId;

  // ---- Local UI state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [subscriberList, setSubscriberList] = useState([]);
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ displayName: '', bio: '' });

  // 👇 Live-updating follower count without Realtime
  const initialSubCount = typeof profile?.subscriber_count === 'number' ? profile.subscriber_count : 0;
  const [displayedSubCount, setDisplayedSubCount] = useState(initialSubCount);

  // keep local count in sync when viewing a different profile / refetch
  useEffect(() => {
    setDisplayedSubCount(initialSubCount);
  }, [initialSubCount, profileId]);

  // Initialize/refresh editable fields ONLY when primitives actually change
  useEffect(() => {
    const displayName = profileDisplayName || '';
    const bio = profileBio || '';
    setEditFormData((prev) => {
      if (prev.displayName === displayName && prev.bio === bio) return prev;
      return { displayName, bio };
    });
  }, [profileDisplayName, profileBio]);

  // 🔒 IMPORTANT: close any open UI (modals/edit) when the profile changes
  useEffect(() => {
    setShowSubscriberModal(false);
    setSubscriberList([]);
    setQrCodeModalOpen(false);
    setIsEditing(false);
  }, [profileId]);

  // 🔒 Also close subscribers modal when the route path changes (e.g., you clicked a subscriber)
  useEffect(() => {
    setShowSubscriberModal(false);
  }, [location.pathname]);

  // ---- Actions
  const handleMessageInternal = useCallback(async () => {
    if (!user?.id || !profileId || user.id === profileId) return;
    const convoId = await getOrCreatePrivateConversation(user.id, profileId);
    if (convoId) navigate(`/chat/${convoId}`);
    else toast.error('Failed to start chat.');
  }, [navigate, profileId, user?.id]);

  const handleMessageBtn = onMessage || handleMessageInternal;

  const handlePhotoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow same file re-select
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
      toast.error(err?.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [isProfileIdValid, onPhotoChange, profileId]);

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => (prev[name] === value ? prev : { ...prev, [name]: value }));
  }, []);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!profileId || !editFormData.displayName.trim()) {
      toast.error('Invalid form data.');
      return;
    }
    try {
      const payload = {
        display_name: editFormData.displayName.trim(),
        bio: editFormData.bio ?? '',
      };
      const { error } = await supabase.from('profiles').update(payload).eq('id', profileId);
      if (error) throw error;
      toast.success('Profile updated!');
      setIsEditing(false);
      onPhotoChange?.();
    } catch (err) {
      toast.error(err?.message || 'Update failed.');
    }
  }, [editFormData.bio, editFormData.displayName, onPhotoChange, profileId]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditFormData({
      displayName: profileDisplayName || '',
      bio: profileBio || '',
    });
  }, [profileBio, profileDisplayName]);

  // Subscriber list (Users only; VPORTs have separate flows)
  const loadSubscribers = useCallback(async () => {
    if (!profileId) return;
    const { data, error } = await supabase
      .from('followers')
      .select('follower_id, profiles!fk_follower(display_name, photo_url, username)')
      .eq('followed_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading subscribers:', error);
      toast.error('Failed to load subscribers.');
      return;
    }
    setSubscriberList(data || []);
    setShowSubscriberModal(true);
  }, [profileId]);

  // 👇 Wire the +1/-1 to the follow button.
  const handleFollowToggle = useCallback((nextFollowing) => {
    setDisplayedSubCount((c) => {
      const delta = nextFollowing ? 1 : -1;
      const next = c + delta;
      return next < 0 ? 0 : next;
    });
  }, []);

  const qrCodeValue = useMemo(() => {
    if (!profileId) return '';
    const base = window.location.origin;
    if (isVport) {
      return `${base}/vport/${profileUsername || profileId}`;
    }
    return `${base}/u/${profileUsername || profileId}`;
  }, [isVport, profileId, profileUsername]);

  // ---- Render
  return (
    <>
      <div className="bg-neutral-900 rounded-xl mx-4 mt-6 p-5 flex items-center justify-between shadow-md min-h-[140px]">
        {/* Left: text & actions */}
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
                <button type="button" onClick={handleCancelEdit} className="text-sm text-neutral-400 hover:underline">
                  Cancel
                </button>
                <button type="submit" className="text-sm text-purple-500 hover:underline">
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white">{profileDisplayName || 'Unnamed'}</h1>
              <p className="text-sm text-neutral-300">{profileBio || 'No bio yet.'}</p>

              {/* Show subscriber count for ANY profile (your own or others) */}
              {!isVport && (
                <button
                  className="text-sm text-purple-400 text-left hover:underline"
                  onClick={loadSubscribers}
                  type="button"
                >
                  {displayedSubCount} Subscriber{displayedSubCount !== 1 ? 's' : ''}
                </button>
              )}

              {isOwnProfile ? (
                <div className="flex gap-3 mt-1">
                  <button onClick={() => setQrCodeModalOpen(true)} className="text-sm text-purple-400 hover:underline">
                    Show QR
                  </button>
                  {!isVport && (
                    <button onClick={() => setIsEditing(true)} className="text-sm text-purple-400 hover:underline">
                      Edit Profile
                    </button>
                  )}
                </div>
              ) : (
                // Viewing someone else’s profile
                <div className="flex flex-col gap-2 mt-2">
                  {!isVport && (
                    <SocialButtons
                      targetUserId={profileId}
                      onChange={handleFollowToggle}  // +1/-1 locally, no Realtime
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Message as USER (normal conversation) */}
                    <button
                      onClick={onMessage || handleMessageInternal}
                      className="bg-neutral-800 text-white rounded-xl px-4 py-1 text-sm hover:bg-neutral-700 transition-colors"
                    >
                      Message
                    </button>

                    {/* Only show when navigating as a VPORT */}
                    {isActingAsVport && (
                      <StartAsVportButton receiverUserId={profileId} />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: avatar */}
        <div className="relative group w-24 h-24 shrink-0 ml-4">
          <img
            src={profilePhotoUrl || '/avatar.jpg'}
            alt={profileDisplayName || 'User avatar'}
            className="w-full h-full object-cover rounded-xl border border-neutral-700"
          />
          {isOwnProfile && !isVport && (
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

      {/* Subscriber Modal (list) */}
      {!isVport && showSubscriberModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowSubscriberModal(false)}
        >
          <div
            className="bg-neutral-900 rounded-xl p-6 max-w-sm w-full text-white overflow-y-auto max-h-[70vh] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3 text-purple-400">Subscribers</h3>
            {subscriberList.length === 0 ? (
              <p className="text-sm text-neutral-500">No subscribers yet.</p>
            ) : (
              <ul className="space-y-2 list-none">
                {subscriberList.map((s) => (
                  <li key={s.follower_id}>
                    {s.profiles?.username ? (
                      <Link
                        to={`/u/${s.profiles.username}`}
                        onClick={() => setShowSubscriberModal(false)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors duration-200 no-underline hover:underline"
                      >
                        <img
                          src={s.profiles?.photo_url || '/avatar.jpg'}
                          className="w-7 h-7 rounded object-cover"
                          alt={s.profiles?.display_name || 'User avatar'}
                        />
                        <span>{s.profiles?.display_name || 'Unnamed'}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 p-2 text-neutral-500">
                        <img
                          src={s.profiles?.photo_url || '/avatar.jpg'}
                          className="w-7 h-7 rounded object-cover"
                          alt={s.profiles?.display_name || 'User avatar'}
                        />
                        <span>{s.profiles?.display_name || 'Unnamed'} (No Username)</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
