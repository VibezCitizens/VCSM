// src/features/profiles/ProfileHeader.jsx
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
import { useIdentity } from '@/state/identityContext';
import { openChatAsVport } from '@/features/chat/vchats/openChatAsVport';
import { openChatWithUser } from '@/features/chat/helpers/chatHelpers';
import MessageButton from '@/ui/Profile/Messagebutton';

// === DEBUG-ONLY IMPORTS ======================================================
import vc from '@/lib/supabaseClientVc';
import { debugAuthProbe } from '@/lib/supabaseClient.debug';
// ============================================================================

import useNotiCount from '@/features/notifications/notificationcenter/hooks/useNotiCount';

const __DBG = true;
const log = (...args) => __DBG && console.debug('[ProfileHeader]', ...args);

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange,
  onMessage,
  allowBannerUpload = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);
  const bannerRef = useRef(null);
  const { user } = useAuth();
  const { identity } = useIdentity();

  const {
    id: profileId,
    display_name: profileDisplayName,
    bio: profileBio,
    photo_url: profilePhotoUrl,
    banner_url: profileBannerUrl,
    username: profileUsername,
    kind: profileKind,
    private: profileIsPrivateFlag,
  } = profile || {};

  const isVport = profileKind === 'vport';
  const isProfileIdValid = !!profileId && /^[0-9a-fA-F-]{36}$/.test(profileId);
  const isPrivate = Boolean(profileIsPrivateFlag);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [subscriberList, setSubscriberList] = useState([]);
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);
  const initialSubCount =
    typeof profile?.subscriber_count === 'number' ? profile.subscriber_count : 0;
  const [displayedSubCount, setDisplayedSubCount] = useState(initialSubCount);
  const [forcedBlocked, setForcedBlocked] = useState(false);
  const [initialSubscribed, setInitialSubscribed] = useState(undefined);
  const [targetActorId, setTargetActorId] = useState(null);

  const ownerActorId = useMemo(
    () => identity?.actorId ?? identity?.vportId ?? null,
    [identity?.actorId, identity?.vportId]
  );

  const unreadCount = useNotiCount({
    actorId: ownerActorId,
    pollMs: 60_000,
    debug: __DBG,
  });

  // --- DEBUG Mount -----------------------------------------------------------
  useEffect(() => {
    if (!__DBG) return;
    log('mount', { isOwnProfile, profileId, profileUsername, profileKind });
    window.__dbgProfileHeader = { profile, profileId };
  }, []);
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setDisplayedSubCount(initialSubCount);
  }, [initialSubCount, profileId]);

  useEffect(() => {
    setShowSubscriberModal(false);
    setSubscriberList([]);
    setQrCodeModalOpen(false);
  }, [profileId]);

 useEffect(() => {
  if (targetActorId) {
    fetchSubscriberCount();
  }
}, [targetActorId, identity?.actorId]);


  // --- resolve targetActorId from profileId ---------------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!profileId) return setTargetActorId(null);
      try {
        const { data, error } = await supabase
          .schema('vc')
          .from('actors')
          .select('id')
          .eq('profile_id', profileId)
          .maybeSingle();
        if (!alive) return;
        if (error && error.code !== 'PGRST116') throw error;
        setTargetActorId(data?.id ?? null);
      } catch {
        if (alive) setTargetActorId(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [profileId]);
  // ---------------------------------------------------------------------------

  // --- initial subscribe status ---------------------------------------------
  useEffect(() => {
    let alive = true;
    async function loadInitialSubscribed() {
      const myActorId = identity?.actorId ?? null;
      if (!myActorId || !targetActorId || myActorId === targetActorId) {
        if (alive) setInitialSubscribed(undefined);
        return;
      }
      try {
        const { count } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id', { head: true, count: 'exact' })
          .eq('follower_actor_id', myActorId)
          .eq('followed_actor_id', targetActorId)
          .eq('is_active', true);
        if (!alive) return;
        setInitialSubscribed((count ?? 0) > 0);
      } catch {
        if (alive) setInitialSubscribed(undefined);
      }
    }
    loadInitialSubscribed();
    return () => {
      alive = false;
    };
  }, [identity?.actorId, targetActorId]);
  // ---------------------------------------------------------------------------

const fetchSubscriberCount = useCallback(async () => {
  if (!targetActorId) return;

  try {
    // 1. Load all relevant block relations
 const { data: blocks } = await supabase
  .schema('vc')
  .from('user_blocks') // ← FIXED HERE
  .select('blocker_actor_id, blocked_actor_id')
  .or(`blocker_actor_id.eq.${targetActorId},blocked_actor_id.eq.${targetActorId}`);



    // Build a set of all actors who are blocked or blocking target
    const blockedSet = new Set();
    for (const b of blocks || []) {
      blockedSet.add(b.blocker_actor_id);
      blockedSet.add(b.blocked_actor_id);
    }
    blockedSet.delete(targetActorId); // remove self

    // 2. Load subscribers (active follows)
    const { data: rows } = await supabase
      .schema('vc')
      .from('actor_follows')
      .select('follower_actor_id')
      .eq('followed_actor_id', targetActorId)
      .eq('is_active', true);

    // 3. Apply Option A filtering
    const filtered = (rows || []).filter(
      (r) => !blockedSet.has(r.follower_actor_id)
    );

    setDisplayedSubCount(filtered.length);
  } catch (e) {
    console.error('[fetchSubscriberCount]', e);
  }
}, [targetActorId]);

  const handlePhotoUpload = useCallback(
    async (e, type = 'photo') => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !isProfileIdValid) return toast.error('Invalid file or profile.');

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
        toast.error(err?.message || 'Upload failed.');
      } finally {
        setter(false);
      }
    },
    [isProfileIdValid, onPhotoChange, profileId]
  );

  const loadSubscribers = useCallback(async () => {
    if (!targetActorId) return;
    try {
      const { data: edges } = await supabase
        .schema('vc')
        .from('actor_follows')
        .select('follower_actor_id, created_at')
        .eq('followed_actor_id', targetActorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const actorIds = [...new Set((edges || []).map((r) => r.follower_actor_id))];
      const { data: actorRows } = await supabase
        .schema('vc')
        .from('actors')
        .select('id, profile_id')
        .in('id', actorIds);

      const profIds = [
        ...new Set((actorRows || []).map((a) => a.profile_id).filter(Boolean)),
      ];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .in('id', profIds);

      const profilesById = new Map((profiles || []).map((p) => [p.id, p]));
      const actorToProfileId = new Map(
        (actorRows || []).map((a) => [a.id, a.profile_id])
      );

      const stitched = (edges || []).map((r) => {
        const pid = actorToProfileId.get(r.follower_actor_id) || null;
        return {
          follower_actor_id: r.follower_actor_id,
          created_at: r.created_at,
          profile: profilesById.get(pid),
        };
      });

      setSubscriberList(stitched);
      setShowSubscriberModal(true);
    } catch {
      toast.error('Failed to load subscribers.');
    }
  }, [targetActorId]);

  const { isBlocking } = useBlockStatus(profileId);

  const qrCodeValue = useMemo(() => {
    if (!profileId) return '';
    const base = window.location.origin;
    return isVport
      ? `${base}/vport/${profileUsername || profileId}`
      : `${base}/u/${profileUsername || profileId}`;
  }, [isVport, profileId, profileUsername]);

  // --- handle message click --------------------------------------------------
  const handleMessage = useCallback(async () => {
    if (!profileId) return;

    try {
      await debugAuthProbe(vc, 'Message:pre');

      // 1) Resolve target actor ID from profileId
      const { data: actorRow, error: actorErr } = await vc
        .from('actors')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (actorErr || !actorRow?.id) {
        console.error('resolve target actor failed:', actorErr);
        return toast.error('Could not resolve chat recipient.');
      }

      const targetActorId = actorRow.id;
      const myActorId = identity?.actorId;

      if (!myActorId) {
        return toast.error('Your identity is still loading.');
      }

      // 2) Handle VPORT → User messaging
      if (identity?.type === 'vport' && identity?.actorId && targetActorId) {
        const { data: convId, error } = await vc.rpc(
          'vc_get_or_create_one_to_one',
          {
            a1: identity.actorId,
            a2: targetActorId,
          }
        );
        if (error || !convId) {
          console.error('VPORT→USER chat error', error);
          return toast.error('Failed to open chat.');
        }
        navigate(`/chat/${convId}`);
        return;
      }

      // 3) User → User messaging
      const { data: convId, error: convErr } = await vc.rpc(
        'vc_get_or_create_one_to_one',
        { a1: myActorId, a2: targetActorId }
      );

      if (convErr || !convId) {
        console.error('openChat error:', convErr);
        return toast.error('Failed to open chat.');
      }

      navigate(`/chat/${convId}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to open chat.');
    }
  }, [identity?.type, identity?.vportId, identity?.actorId, profileId, navigate]);

  // ---------------------------------------------------------------------------

  if (forcedBlocked && !isOwnProfile) return null;

  const onBannerError = (e) => {
    if (e?.target?.src !== '/default-banner.jpg')
      e.target.src = '/default-banner.jpg';
  };
  const onAvatarError = (e) => {
    if (e?.target?.src !== '/avatar.jpg') e.target.src = '/avatar.jpg';
  };

  return (
    <div className="w-full text-white">
      {/* Banner */}
      <div className="relative w-full h-44 md:h-60">
        <img
          src={profileBannerUrl || '/default-banner.jpg'}
          alt="Profile banner"
          className="absolute inset-0 w-full h-full object-cover"
          onError={onBannerError}
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
            />
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="absolute top-3 right-3 rounded-xl px-3 py-1 text-xs bg-black/40 hover:bg-black/60 backdrop-blur-sm"
            >
              {isUploadingBanner ? 'Uploading…' : 'Change Banner'}
            </button>
          </>
        )}
      </div>

      {/* Header */}
      <div className="relative">
        <div className="mx-auto max-w-5xl px-4">
          <div className="-mt-14 md:-mt-16 relative z-10">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-5 md:p-6 shadow-lg">
              <div className="flex items-start gap-4 md:gap-6">
                {/* Avatar */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                  <img
                    src={profilePhotoUrl || '/avatar.jpg'}
                    alt="avatar"
                    className="w-full h-full object-cover rounded-2xl border border-neutral-700 shadow"
                    onError={onAvatarError}
                  />
                  {isOwnProfile && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={fileRef}
                        onChange={(e) => handlePhotoUpload(e, 'photo')}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-xs opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {isUploadingPhoto ? 'Uploading…' : 'Change'}
                      </button>
                    </>
                  )}
                </div>

                {/* Info + actions */}
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
                          {displayedSubCount} Subscriber
                          {displayedSubCount !== 1 ? 's' : ''}
                        </button>
                      )}
                    </div>

                    {/* Show QR (own profile) */}
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

                  {/* Actions – stacked, right aligned, **no overlap** */}
                  {!isOwnProfile && !isVport && (
                    <div className="mt--4 flex justify-end">
                      <div className="flex flex-col items-end gap-2">
                        <MessageButton label="Message" onClick={handleMessage} />
                        <SocialActions
                          profileId={profileId}
                          targetActorId={targetActorId}
                          isOwnProfile={isOwnProfile}
                          initialSubscribed={initialSubscribed}
                          onSubscribeToggle={() => fetchSubscriberCount()}
                          onFollowToggle={() => fetchSubscriberCount()}
                          profileIsPrivate={isPrivate}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Three-dots menu (moved OUTSIDE stacking context) */}
{!isOwnProfile && (
  <div className="fixed top-4 right-4 z-[99999] pointer-events-auto">
    <ProfileDots
    targetActorId={targetActorId}

      initialBlocked={isBlocking}
      onBlock={(nowBlocked) => {
        toast.success(nowBlocked ? 'User blocked' : 'User unblocked');
        if (nowBlocked) navigate('/', { replace: true });
      }}
    />
  </div>
)}

            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
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
