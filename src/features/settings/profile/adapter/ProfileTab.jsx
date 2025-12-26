// src/features/settings/profile/adapter/ProfileTab.jsx
// ============================================================
// ProfileTab (Adapter)
// - Connects controller → view
// - Owns local editable draft
// - Owns transient UI feedback (saved toast)
// - No DAL
// - No identity resolution
// ============================================================

import { useEffect, useRef, useState } from 'react'

import { useProfileController } from '../controller/Profile.controller'
import ProfileTabView from '../ui/ProfileTab.view'

export default function ProfileTab() {
  const {
    ready,
    loading,
    saving,
    error,

    mode,
    profile,
    profilePath,

    saveProfile,
  } = useProfileController()

  // ------------------------------------------------------------
  // Refs (file inputs live here, not in view)
  // ------------------------------------------------------------
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  // ------------------------------------------------------------
  // Local editable draft
  // ------------------------------------------------------------
  const [draft, setDraft] = useState(null)

  // ------------------------------------------------------------
  // UI feedback
  // ------------------------------------------------------------
  const [saved, setSaved] = useState(false)

  // Hydrate draft when controller profile loads
  useEffect(() => {
    if (!profile) return

    setDraft({
      ...profile,

      // transient (never persisted)
      __avatarFile: null,
      __bannerFile: null,
    })
  }, [profile])

  // Auto-hide saved toast
  useEffect(() => {
    if (!saved) return

    const t = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(t)
  }, [saved])

  // ------------------------------------------------------------
  // Loading guard
  // ------------------------------------------------------------
  if (!ready || loading || !draft) {
    return (
      <div className="py-6 text-sm text-zinc-400">
        Loading profile…
      </div>
    )
  }

  // ------------------------------------------------------------
  // Handlers — Avatar
  // ------------------------------------------------------------
  const onPickAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDraft(d => ({
      ...d,
      __avatarFile: file,
      photoUrl: URL.createObjectURL(file),
    }))
  }

  const onRemoveAvatar = () =>
    setDraft(d => ({
      ...d,
      __avatarFile: null,
      photoUrl: '',
    }))

  // ------------------------------------------------------------
  // Handlers — Banner
  // ------------------------------------------------------------
  const onPickBanner = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDraft(d => ({
      ...d,
      __bannerFile: file,
      bannerUrl: URL.createObjectURL(file),
    }))
  }

  const onRemoveBanner = () =>
    setDraft(d => ({
      ...d,
      __bannerFile: null,
      bannerUrl: '/default-banner.jpg',
    }))

  // ------------------------------------------------------------
  // Save
  // ------------------------------------------------------------
  const onSave = async () => {
    const ok = await saveProfile(draft)

    if (ok !== false) {
      setSaved(true)
    }
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <>
      <ProfileTabView
        /* identity */
        mode={mode}
        username={draft.username}
        displayName={draft.displayName}
        email={draft.email}
        bio={draft.bio}

        /* media */
        photoUrl={draft.photoUrl}
        bannerUrl={draft.bannerUrl}
        previewAvatar={draft.__avatarFile ? draft.photoUrl : null}
        previewBanner={draft.__bannerFile ? draft.bannerUrl : null}

        /* state */
        saving={saving}
        error={error}

        /* refs */
        avatarInputRef={avatarInputRef}
        bannerInputRef={bannerInputRef}

        /* handlers */
        onPickAvatar={onPickAvatar}
        onRemoveAvatar={onRemoveAvatar}
        onPickBanner={onPickBanner}
        onRemoveBanner={onRemoveBanner}
        onChangeDisplayName={(v) =>
          setDraft(d => ({ ...d, displayName: v }))
        }
        onChangeBio={(v) =>
          setDraft(d => ({ ...d, bio: v }))
        }
        onSave={onSave}

        /* navigation */
        profilePath={profilePath}
      />

      {/* ================= SAVE CONFIRMATION ================= */}
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
  )
}
