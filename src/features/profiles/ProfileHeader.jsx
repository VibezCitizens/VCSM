// src/features/profiles/ProfileHeader.jsx
// Profile header (banner, avatar, name, bio, subscribers) + actions.
// Adds three-dots menu (block/unblock). On block, redirect to "/" and
// hide the header immediately with a local "forcedBlocked" gate.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import VisibleQRCode from '@/features/profiles/components/VisibleQRCode';
import SocialActions from '@/features/profiles/components/SocialActions';
import ProfileDots from '@/features/profiles/components/ProfileDots';
import { useBlockStatus } from '@/features/profiles/hooks/useBlockStatus';

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange,
  onMessage,            // kept for API compatibility (unused here)
  allowBannerUpload = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);
  const bannerRef = useRef(null);
  const { user } = useAuth();

  const {
    id: profileId,
    display_name: profileDisplayName,
    bio: profileBio,
    photo_url: profilePhotoUrl,
    banner_url: profileBannerUrl,
    username: profileUsername,
    kind: profileKind,
    // ⬇️ ensure we read this off the object we were given
    private: profileIsPrivateFlag,
  } = profile || {};

  const isVport = profileKind === 'vport';
  const isProfileIdValid = !!profileId && /^[0-9a-fA-F-]{36}$/.test(profileId);
  const isPrivate = Boolean(profileIsPrivateFlag); // coerce truthy forms ("t", 1, "true") to true

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);

  const [subscriberList, setSubscriberList] = useState([]);
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);
  const initialSubCount =
    typeof profile?.subscriber_count === 'number' ? profile.subscriber_count : 0;
  const [displayedSubCount, setDisplayedSubCount] = useState(initialSubCount);

  // Prevent any brief flash of this header after we block & navigate
  const [forcedBlocked, setForcedBlocked] = useState(false);

  // initial subscribed state for the Subscribe button
  const [initialSubscribed, setInitialSubscribed] = useState(undefined);

  // 🔎 DEV DEBUG: trace what we received
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[Header] profile debug', {
      profileId,
      username: profileUsername,
      kind: profileKind,
      private: profileIsPrivateFlag,
      isPrivateComputed: isPrivate,
      initialSubCount,
      isOwnProfile,
    });
    // expose a tiny handle for quick manual checks in console
    // eslint-disable-next-line no-underscore-dangle
    window.__dbgProfileHeader = { profile, profileId, isPrivate };
  }

  // Keep initial value from prop, but we'll reconcile with the server shortly.
  useEffect(() => setDisplayedSubCount(initialSubCount), [initialSubCount, profileId]);

  useEffect(() => {
    setShowSubscriberModal(false);
    setSubscriberList([]);
    setQrCodeModalOpen(false);
  }, [profileId]);

  useEffect(() => setShowSubscriberModal(false), [location.pathname]);

  // Load initial subscribe status (viewer -> profile)
  useEffect(() => {
    let alive = true;
    async function loadInitialSubscribed() {
      if (!user?.id || !profileId || user.id === profileId) {
        if (alive) setInitialSubscribed(undefined);
        return;
      }
      try {
        const { data, error } = await supabase
          .schema('vc')
          .from('followers')
          .select('is_active')
          .eq('follower_id', user.id)
          .eq('followed_id', profileId)
          .maybeSingle();
        if (!alive) return;
        if (error && error.code !== 'PGRST116') throw error;
        setInitialSubscribed(!!data?.is_active);
      } catch {
        if (alive) setInitialSubscribed(undefined);
      }
    }
    loadInitialSubscribed();
    return () => { alive = false; };
  }, [user?.id, profileId]);

  // Live subscriber count
  const fetchSubscriberCount = useCallback(async () => {
    if (!profileId) return;
    try {
      const { count, error } = await supabase
        .schema('vc')
        .from('followers')
        .select('follower_id', { count: 'exact', head: true })
        .eq('followed_id', profileId)
        .eq('is_active', true);

      if (error) throw error;
      if (typeof count === 'number') {
        setDisplayedSubCount(count);
      }
    } catch (err) {
      console.error('fetchSubscriberCount failed:', err?.message || err);
    }
  }, [profileId]);

  // Refetch when profile changes and whenever user navigates to this page
  useEffect(() => {
    fetchSubscriberCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => {
    // Any navigation to this route should refresh the count
    fetchSubscriberCount();
  }, [location.pathname, fetchSubscriberCount]);

  const handlePhotoUpload = useCallback(
    async (e, type = 'photo') => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!isProfileIdValid) return toast.error('Profile ID invalid.');

      const setter = type === 'photo' ? setIsUploadingPhoto : setIsUploadingBanner;
      setter(true);
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.7,
          maxWidthOrHeight: type === 'photo' ? 600 : 1600,
          useWebWorker: true,
        });

        const key =
          type === 'photo'
            ? `profile-pictures/${profileId}.jpg`
            : `profile-banners/${profileId}.jpg`;

        const { url, error: uploadError } = await uploadToCloudflare(compressed, key);
        if (uploadError || !url) throw new Error('Upload failed.');

        const updateField = type === 'photo' ? { photo_url: url } : { banner_url: url };

        const { error: supabaseError } = await supabase
          .from('profiles')
          .update(updateField)
          .eq('id', profileId);

        if (supabaseError) throw new Error(supabaseError.message);
        toast.success(`${type === 'photo' ? 'Profile' : 'Banner'} updated!`);
        onPhotoChange?.();
      } catch (err) {
        console.error(err);
        toast.error(err?.message || 'Upload failed.');
      } finally {
        setter(false);
      }
    },
    [isProfileIdValid, onPhotoChange, profileId]
  );

  const loadSubscribers = useCallback(async () => {
    if (!profileId) return;
    const { data, error } = await supabase
      .schema('vc')
      .from('followers')
      .select('follower_id, created_at')
      .eq('followed_id', profileId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return toast.error('Failed to load subscribers.');
    setSubscriberList(data || []);
    setShowSubscriberModal(true);
  }, [profileId]);

  // Let SocialActions bump the displayed count optimistically, then reconcile
  const handleFollowToggle = useCallback((nextFollowing) => {
    setDisplayedSubCount((c) => Math.max(0, c + (nextFollowing ? 1 : -1)));
    setTimeout(fetchSubscriberCount, 300);
  }, [fetchSubscriberCount]);

  // Read block status (for initial state of dots menu)
  const { isBlocking /* isBlockedBy, anyBlock, loading */ } = useBlockStatus(profileId);

  const qrCodeValue = useMemo(() => {
    if (!profileId) return '';
    const base = window.location.origin;
    return isVport
      ? `${base}/vport/${profileUsername || profileId}`
      : `${base}/u/${profileUsername || profileId}`;
  }, [isVport, profileId, profileUsername]);

  // DEV DEBUG: what are we sending down to SocialActions?
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[Header -> SocialActions props]', {
      profileId,
      isOwnProfile,
      initialSubscribed,
      isPrivateProp: isPrivate,
    });
  }

  // If we just blocked, hide header immediately (avoid flash while routing)
  if (forcedBlocked && !isOwnProfile) return null;

  return (
    <div className="w-full text-white">
      {/* Banner */}
      <div className="relative w-full h-44 md:h-60">
        <img
          src={profileBannerUrl || '/default-banner.jpg'}
          alt="Profile banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

        {isOwnProfile && allowBannerUpload && (
          <>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={bannerRef}
              onChange={(e) => handlePhotoUpload(e, 'banner')}
              disabled={isUploadingBanner}
            />
            <button
              type="button"
              onClick={() => !isUploadingBanner && bannerRef.current?.click()}
              className="absolute top-3 right-3 rounded-xl px-3 py-1 text-xs bg-black/40 hover:bg-black/60 backdrop-blur-sm"
            >
              {isUploadingBanner ? 'Uploading…' : 'Change Banner'}
            </button>
          </>
        )}
      </div>

      {/* Header card */}
      <div className="relative">
        <div className="mx-auto max-w-5xl px-4">
          <div className="-mt-14 md:-mt-16 relative z-10">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-5 md:p-6 shadow-lg relative">
              <div className="flex items-start gap-4 md:gap-6">
                {/* Avatar */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                  <img
                    src={profilePhotoUrl || '/avatar.jpg'}
                    alt="avatar"
                    className="w-full h-full object-cover rounded-2xl border border-neutral-700 shadow"
                  />
                  {isOwnProfile && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={fileRef}
                        onChange={(e) => handlePhotoUpload(e, 'photo')}
                        disabled={isUploadingPhoto}
                      />
                      <button
                        type="button"
                        onClick={() => !isUploadingPhoto && fileRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-xs opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {isUploadingPhoto ? 'Uploading…' : 'Change'}
                      </button>
                    </>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-xl md:text-2xl font-semibold truncate">
                        {profileDisplayName || 'Unnamed'}
                      </h1>
                      <p className="mt-1 text-sm text-neutral-300 line-clamp-3">
                        {profileBio || 'No bio yet.'}
                      </p>

                      {!isVport && (
                        <button
                          onClick={loadSubscribers}
                          className="mt-2 text-sm text-purple-400 hover:underline"
                        >
                          {displayedSubCount} Subscriber{displayedSubCount !== 1 ? 's' : ''}
                        </button>
                      )}
                    </div>

                    {/* Owner-only action: Show QR */}
                    {isOwnProfile && (
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => setQrCodeModalOpen(true)}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm text-white"
                        >
                          Show QR
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Three-dots menu (top-right) for visitors */}
              {!isOwnProfile && (
                <div className="absolute top-4 right-4 z-50">
                  <ProfileDots
                    targetId={profileId}
                    initialBlocked={isBlocking}
                    onBlock={(nowBlocked) => {
                      toast.success(nowBlocked ? 'User blocked' : 'User unblocked');
                      if (nowBlocked) {
                        setForcedBlocked(true); // hide header instantly
                        navigate('/', { replace: true, state: { justBlocked: profileId } });
                      }
                    }}
                  />
                </div>
              )}

              {/* Bottom-right social buttons */}
              {!isOwnProfile && !isVport && (
                <div className="absolute bottom-4 right-4 md:bottom-5 md:right-5 z-20">
                  <SocialActions
                    profileId={profileId}
                    isOwnProfile={isOwnProfile}
                    initialSubscribed={initialSubscribed}
                    onSubscribeToggle={handleFollowToggle}
                    onFollowToggle={handleFollowToggle}
                    /* NEW: enable follow-request path for private profiles */
                    profileIsPrivate={isPrivate}
                    /* If you had an acceptance callback, you could refresh counts here */
                    // onFollowRequestAccepted={() => fetchSubscriberCount()}
                  />
                </div>
              )}
            </div>

            <div className="h-2" />
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrCodeModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQrCodeModalOpen(false)}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/70 select-none">
            Tap anywhere to close
          </div>
          <div className="max-w-[90vw] max-h-[80vh]">
            <VisibleQRCode value={qrCodeValue} />
          </div>
        </div>
      )}
    </div>
  );
}
