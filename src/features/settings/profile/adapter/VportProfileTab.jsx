// src/features/settings/profile/adapter/VportProfileTab.jsx

import { useEffect, useRef, useState } from "react";
import ProfileTabView from "../ui/ProfileTab.view";

export default function VportProfileTab({ controller }) {
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

  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDraft({
      ...profile,
      __avatarFile: null,
      __bannerFile: null,
    });
  }, [profile]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  if (!ready || loading || !draft) {
    return <div className="py-6 text-sm text-zinc-400">Loading VPORT…</div>;
  }

  // Avatar / Banner handlers (same behavior)
  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDraft((d) => ({
      ...d,
      __avatarFile: file,
      photoUrl: URL.createObjectURL(file),
    }));
  };

  const onRemoveAvatar = () =>
    setDraft((d) => ({ ...d, __avatarFile: null, photoUrl: "" }));

  const onPickBanner = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDraft((d) => ({
      ...d,
      __bannerFile: file,
      bannerUrl: URL.createObjectURL(file),
    }));
  };

  const onRemoveBanner = () =>
    setDraft((d) => ({
      ...d,
      __bannerFile: null,
      bannerUrl: "/default-banner.jpg",
    }));

  const onSaveProfile = async () => {
    const ok = await saveProfile(draft);
    if (ok !== false) setSaved(true);
  };

  return (
    <>
      {/* VPORT BASIC PROFILE (existing) */}
      <ProfileTabView
        mode={mode}
        username={draft.username}
        displayName={draft.displayName}
        email={draft.email} // null for vport in mapper (fine)
        bio={draft.bio}
        photoUrl={draft.photoUrl}
        bannerUrl={draft.bannerUrl}
        previewAvatar={draft.__avatarFile ? draft.photoUrl : null}
        previewBanner={draft.__bannerFile ? draft.bannerUrl : null}
        saving={saving}
        error={error}
        saved={saved}
        avatarInputRef={avatarInputRef}
        bannerInputRef={bannerInputRef}
        onPickAvatar={onPickAvatar}
        onRemoveAvatar={onRemoveAvatar}
        onPickBanner={onPickBanner}
        onRemoveBanner={onRemoveBanner}
        onChangeDisplayName={(v) => setDraft((d) => ({ ...d, displayName: v }))}
        onChangeBio={(v) => setDraft((d) => ({ ...d, bio: v }))}
        onSave={onSaveProfile}
        profilePath={profilePath}
      />

      {saved && (
        <div
          className="
            fixed bottom-24 left-1/2 -translate-x-1/2
            z-50
            px-4 py-2 rounded-full
            bg-green-600 text-white text-sm font-medium
            shadow-lg
            animate-fade-in
          "
        >
          Saved ✓
        </div>
      )}
    </>
  );
}
