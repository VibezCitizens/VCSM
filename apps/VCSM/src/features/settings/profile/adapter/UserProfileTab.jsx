// src/features/settings/profile/adapter/UserProfileTab.jsx

import { useEffect, useRef, useState } from "react";
import ProfileTabView from "../ui/ProfileTab.view";

export default function UserProfileTab({ controller }) {
  const {
    ready,
    loading,
    saving,
    error,
    mode,
    profile,
    profilePath,
    saveProfile,
  } = controller;

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const avatarBlobRef = useRef(null);
  const bannerBlobRef = useRef(null);

  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState(null);
  const [previewBannerUrl, setPreviewBannerUrl] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setDraft({ ...profile, __avatarFile: null, __bannerFile: null });
  }, [profile]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  // Revoke any remaining blob URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarBlobRef.current) URL.revokeObjectURL(avatarBlobRef.current);
      if (bannerBlobRef.current) URL.revokeObjectURL(bannerBlobRef.current);
    };
  }, []);

  if (!ready || loading || !draft) {
    return <div className="py-6 text-sm text-white/50">Loading profile...</div>;
  }

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarBlobRef.current) URL.revokeObjectURL(avatarBlobRef.current);
    const blobUrl = URL.createObjectURL(file);
    avatarBlobRef.current = blobUrl;
    setPreviewAvatarUrl(blobUrl);
    setDraft((d) => ({ ...d, __avatarFile: file }));
  };

  const onRemoveAvatar = () => {
    if (avatarBlobRef.current) { URL.revokeObjectURL(avatarBlobRef.current); avatarBlobRef.current = null; }
    setPreviewAvatarUrl(null);
    setDraft((d) => ({ ...d, __avatarFile: null, photoUrl: "" }));
  };

  const onPickBanner = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bannerBlobRef.current) URL.revokeObjectURL(bannerBlobRef.current);
    const blobUrl = URL.createObjectURL(file);
    bannerBlobRef.current = blobUrl;
    setPreviewBannerUrl(blobUrl);
    setDraft((d) => ({ ...d, __bannerFile: file }));
  };

  const onRemoveBanner = () => {
    if (bannerBlobRef.current) { URL.revokeObjectURL(bannerBlobRef.current); bannerBlobRef.current = null; }
    setPreviewBannerUrl(null);
    setDraft((d) => ({ ...d, __bannerFile: null, bannerUrl: "/default-banner.jpg" }));
  };

  const onSave = async () => {
    try {
      await saveProfile(draft);
      // Revoke and clear previews — profile effect will sync draft with confirmed URLs
      if (avatarBlobRef.current) { URL.revokeObjectURL(avatarBlobRef.current); avatarBlobRef.current = null; }
      if (bannerBlobRef.current) { URL.revokeObjectURL(bannerBlobRef.current); bannerBlobRef.current = null; }
      setPreviewAvatarUrl(null);
      setPreviewBannerUrl(null);
      setSaved(true);
    } catch {
      // Rollback preview — draft.photoUrl was never mutated, so original URL is restored automatically
      if (avatarBlobRef.current) { URL.revokeObjectURL(avatarBlobRef.current); avatarBlobRef.current = null; }
      if (bannerBlobRef.current) { URL.revokeObjectURL(bannerBlobRef.current); bannerBlobRef.current = null; }
      setPreviewAvatarUrl(null);
      setPreviewBannerUrl(null);
      setDraft((d) => ({ ...d, __avatarFile: null, __bannerFile: null }));
    }
  };

  const busyAvatar = saving && !!draft.__avatarFile;
  const busyBanner = saving && !!draft.__bannerFile;

  return (
    <>
      <ProfileTabView
        mode={mode}
        username={draft.username}
        displayName={draft.displayName}
        email={draft.email}
        bio={draft.bio}
        photoUrl={draft.photoUrl}
        bannerUrl={draft.bannerUrl}
        previewAvatar={previewAvatarUrl}
        previewBanner={previewBannerUrl}
        saving={saving}
        busyAvatar={busyAvatar}
        busyBanner={busyBanner}
        error={error}
        avatarInputRef={avatarInputRef}
        bannerInputRef={bannerInputRef}
        onPickAvatar={onPickAvatar}
        onRemoveAvatar={onRemoveAvatar}
        onPickBanner={onPickBanner}
        onRemoveBanner={onRemoveBanner}
        onChangeDisplayName={(v) => setDraft((d) => ({ ...d, displayName: v }))}
        onChangeBio={(v) => setDraft((d) => ({ ...d, bio: v }))}
        onSave={onSave}
        profilePath={profilePath}
      />

      {saved && (
        <div
          className="
            fixed bottom-24 left-1/2 -translate-x-1/2
            z-50
            px-4 py-2 rounded-full
            settings-card-surface border border-emerald-300/30
            text-emerald-200 text-sm font-medium
            shadow-lg animate-fade-in
          "
        >
          Saved
        </div>
      )}
    </>
  );
}
