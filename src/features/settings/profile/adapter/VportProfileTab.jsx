// src/features/settings/profile/adapter/VportProfileTab.jsx

import { useEffect, useRef, useState } from "react";
import ProfileTabView from "../ui/ProfileTab.view";
import VportAboutDetailsView from "../ui/VportAboutDetails.view";
import { useVportPublicDetailsController } from "../controller/VportPublicDetails.controller";

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
    subjectId, // vportId
  } = controller;

  const {
    loading: aboutLoading,
    saving: aboutSaving,
    error: aboutError,
    details,
    saveDetails,
  } = useVportPublicDetailsController(subjectId);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [draft, setDraft] = useState(null);
  const [aboutDraft, setAboutDraft] = useState(null);

  const [saved, setSaved] = useState(false);
  const [aboutSaved, setAboutSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDraft({
      ...profile,
      __avatarFile: null,
      __bannerFile: null,
    });
  }, [profile]);

  useEffect(() => {
    if (!details) return;
    setAboutDraft({ ...details });
  }, [details]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  useEffect(() => {
    if (!aboutSaved) return;
    const t = setTimeout(() => setAboutSaved(false), 2000);
    return () => clearTimeout(t);
  }, [aboutSaved]);

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

  const onSaveAbout = async () => {
    if (!aboutDraft) return;
    const updated = await saveDetails(aboutDraft);
    if (updated) setAboutSaved(true);
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
        avatarInputRef={avatarInputRef}
        bannerInputRef={bannerInputRef}
        onPickAvatar={onPickAvatar}
        onRemoveAvatar={onRemoveAvatar}
        onPickBanner={onPickBanner}
        onRemoveBanner={onRemoveBanner}
        onChangeDisplayName={(v) =>
          setDraft((d) => ({ ...d, displayName: v }))
        }
        onChangeBio={(v) => setDraft((d) => ({ ...d, bio: v }))}
        onSave={onSaveProfile}
        profilePath={profilePath}
      />

      {/* VPORT ABOUT (PUBLIC DETAILS) */}
      <div className="mt-4">
        <VportAboutDetailsView
          loading={aboutLoading}
          saving={aboutSaving}
          error={aboutError}
          draft={aboutDraft}
          onChange={(patch) =>
            setAboutDraft((d) => {
              const prev = d || {};
              const p = patch || {};
              const next = { ...prev, ...p };

              // deep-merge nested json blobs so they never get wiped
              if (p.address) next.address = { ...(prev.address || {}), ...(p.address || {}) };
              if (p.socialLinks) next.socialLinks = { ...(prev.socialLinks || {}), ...(p.socialLinks || {}) };

              // hours editor should pass full object; keep as-is
              if (p.hours) next.hours = p.hours;

              // keep arrays as arrays (guard against accidental string/undefined)
              if (p.highlights !== undefined) next.highlights = Array.isArray(p.highlights) ? p.highlights : prev.highlights || [];
              if (p.languages !== undefined) next.languages = Array.isArray(p.languages) ? p.languages : prev.languages || [];
              if (p.paymentMethods !== undefined) next.paymentMethods = Array.isArray(p.paymentMethods) ? p.paymentMethods : prev.paymentMethods || [];

              return next;
            })
          }
          onSave={onSaveAbout}
          saved={aboutSaved}
        />
      </div>

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

      {aboutSaved && (
        <div
          className="
            fixed bottom-36 left-1/2 -translate-x-1/2
            z-50
            px-4 py-2 rounded-full
            bg-violet-600 text-white text-sm font-medium
            shadow-lg
            animate-fade-in
          "
        >
          About saved ✓
        </div>
      )}
    </>
  );
}
