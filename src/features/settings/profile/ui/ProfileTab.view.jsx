// src/features/settings/profile/ui/ProfileTab.view.jsx
// ============================================================
// ProfileTab View
// - Pure presentational component
// - No data fetching
// - No identity logic
// - No uploads
// ============================================================

import { Link } from 'react-router-dom'
import Card from '@/features/settings/ui/Card'

export default function ProfileTabView({
  // identity
  mode, // 'user' | 'vport'
  username,
  displayName,
  email,
  bio,

  // media
  photoUrl,
  bannerUrl,
  previewAvatar,
  previewBanner,

  // state
  saving,
  error,
  saved, // ✅ NEW (pure UI flag)

  // refs
  avatarInputRef,
  bannerInputRef,

  // handlers
  onPickAvatar,
  onRemoveAvatar,
  onPickBanner,
  onRemoveBanner,
  onChangeDisplayName,
  onChangeBio,
  onSave,

  // navigation
  profilePath,
}) {
  const isVport = mode === 'vport'

  return (
    <div className="space-y-4">
      <Card>
        {/* ================= HEADER ================= */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">
            {isVport ? 'VPORT Profile' : 'Profile'}
          </div>

          <Link
            to={profilePath}
            className="text-white text-sm"
            aria-label="View profile"
          >
            View {isVport ? 'VPORT' : 'my'} profile
          </Link>
        </div>

        {/* ================= BANNER ================= */}
        <section className="space-y-1">
          <label className="text-xs text-zinc-300">
            {isVport ? 'VPORT banner' : 'Profile banner'}
          </label>

          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <div className="relative w-full h-32 sm:h-40 md:h-48">
              <img
                src={previewBanner || bannerUrl || '/default-banner.jpg'}
                alt="banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={onPickBanner}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="rounded-xl bg-zinc-800 text-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-700"
              disabled={saving}
            >
              Choose banner
            </button>

            {(previewBanner || bannerUrl) && (
              <button
                type="button"
                onClick={onRemoveBanner}
                className="rounded-xl bg-zinc-800 text-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-700"
                disabled={saving}
              >
                Remove
              </button>
            )}

            <span className="text-[11px] text-zinc-500">
              Wide image recommended (PNG/JPG ≤ 5MB)
            </span>
          </div>
        </section>

        {/* ================= AVATAR ================= */}
        <section className="mt-4 space-y-1">
          <label className="text-xs text-zinc-300">
            {isVport ? 'VPORT picture' : 'Profile picture'}
          </label>

          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center">
              {(previewAvatar || photoUrl) ? (
                <img
                  src={previewAvatar || photoUrl}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-zinc-500">
                  <path
                    fill="currentColor"
                    d="M12 12a5 5 0 100-10 5 5 0 000 10Zm-7 9a7 7 0 0114 0v1H5v-1Z"
                  />
                </svg>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={onPickAvatar}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="rounded-xl bg-zinc-800 text-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-700"
                disabled={saving}
              >
                Choose image
              </button>

              {(previewAvatar || photoUrl) && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  className="rounded-xl bg-zinc-800 text-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-700"
                  disabled={saving}
                >
                  Remove
                </button>
              )}

              <span className="text-[11px] text-zinc-500">
                PNG/JPG ≤ 5MB
              </span>
            </div>
          </div>
        </section>

        {/* ================= USERNAME ================= */}
        <section className="mt-4 space-y-1">
          <label className="text-xs text-zinc-400">Username</label>
          <div className="relative">
            <input
              value={username ? `@${username}` : '—'}
              disabled
              readOnly
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-2"
            />
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"
              title="Usernames are permanent"
            >
              🔒
            </span>
          </div>
        </section>

        {/* ================= DISPLAY NAME ================= */}
        <section className="mt-3 space-y-1">
          <label className="text-xs text-zinc-300">Display name</label>
          <input
            value={displayName}
            onChange={(e) => onChangeDisplayName(e.target.value)}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white px-3 py-2"
            placeholder={isVport ? 'VPORT name' : 'Your name'}
            disabled={saving}
          />
        </section>

        {/* ================= EMAIL ================= */}
        {email && (
          <section className="mt-3 space-y-1">
            <label className="text-xs text-zinc-400">Email</label>
            <input
              value={email}
              disabled
              readOnly
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-2"
            />
          </section>
        )}

        {/* ================= BIO ================= */}
        <section className="mt-3 space-y-1">
          <label className="text-xs text-zinc-300">
            {isVport ? 'About' : 'Bio'}
          </label>
          <textarea
            value={bio}
            onChange={(e) => onChangeBio(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white px-3 py-2 resize-y"
            disabled={saving}
          />
        </section>

        {/* ================= ERROR ================= */}
        {error && (
          <div className="mt-3 rounded-lg bg-red-950/60 border border-red-900 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* ================= SAVED CONFIRMATION ================= */}
        {saved && !saving && (
          <div className="mt-3 text-sm text-green-400 flex items-center gap-1">
            <span>✓</span>
            <span>Changes saved</span>
          </div>
        )}

        {/* ================= ACTIONS ================= */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              saving
                ? 'bg-zinc-800 text-zinc-400'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Card>
    </div>
  )
}
