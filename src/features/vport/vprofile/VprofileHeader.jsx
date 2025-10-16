// C:\Users\vibez\OneDrive\Desktop\no src\src\features\vport\vprofile\VprofileHeader.jsx
// Lightweight VPORT header mirroring ProfileHeader API, but tailored for VPORTs.
// - Keeps upload (photo/banner), QR, and block menu.
// - Hides SocialActions (subscribe/follow) by default for VPORTs.
// - Accepts same props shape so you can swap it in without touching callers.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import VisibleQRCode from '@/features/profiles/components/VisibleQRCode';
import ProfileDots from '@/features/profiles/components/ProfileDots';
import { useBlockStatus } from '@/features/profiles/hooks/useBlockStatus';

export default function VprofileHeader({
  profile,
  isOwnProfile = false,
  onPhotoChange,
  allowBannerUpload = true,
  // Optional: if you do want to display a count (e.g., subscribers/customers) for VPORT
  // pass it in; otherwise it remains hidden.
  metricLabel = 'Subscribers',
  metricCount,
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
    private: profileIsPrivateFlag,
  } = profile || {};

  const isVport = profileKind === 'vport' || true; // this header is VPORT-specific
  const isProfileIdValid = !!profileId && /^[0-9a-fA-F-]{36}$/.test(profileId);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);

  // Prevent any brief flash of this header after we block & navigate
  const [forcedBlocked, setForcedBlocked] = useState(false);

  // DEV TRACE
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[VprofileHeader] profile debug', {
      profileId,
      username: profileUsername,
      kind: profileKind,
      isVport,
      metricCount,
      isOwnProfile,
    });
  }

  useEffect(() => {
    setQrCodeModalOpen(false);
  }, [profileId]);

  useEffect(() => {
    // Any route change closes the QR modal
    setQrCodeModalOpen(false);
  }, [location.pathname]);

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

  // Read block status (for initial state of dots menu)
  const { isBlocking /* isBlockedBy, anyBlock, loading */ } = useBlockStatus(profileId);

  const qrCodeValue = useMemo(() => {
    if (!profileId) return '';
    const base = window.location.origin;
    // VPORT deep link
    return `${base}/vport/${profileUsername || profileId}`;
  }, [profileId, profileUsername]);

  if (forcedBlocked && !isOwnProfile) return null;

  return (
    <div className="w-full text-white">
      {/* Banner */}
      <div className="relative w-full h-44 md:h-60">
        <img
          src={profileBannerUrl || '/default-banner.jpg'}
          alt="VPORT banner"
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
                        {profileDisplayName || 'VPORT'}
                      </h1>
                      <p className="mt-1 text-sm text-neutral-300 line-clamp-3">
                        {profileBio || 'No description yet.'}
                      </p>

                      {/* Optional metric (hidden unless provided) */}
                      {typeof metricCount === 'number' && (
                        <div className="mt-2 text-sm text-purple-400">
                          {metricCount} {metricLabel}
                        </div>
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
                      toast.success(nowBlocked ? 'Profile blocked' : 'Profile unblocked');
                      if (nowBlocked) {
                        setForcedBlocked(true); // hide header instantly
                        navigate('/', { replace: true, state: { justBlocked: profileId } });
                      }
                    }}
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
