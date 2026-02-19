// src/features/settings/profile/ui/ProfileTab.view.jsx

import { Link } from 'react-router-dom'
import Card from '@/features/settings/ui/Card'
import ProfessionalAccessButton from './ProfessionalAccessButton'

export default function ProfileTabView({
  username,
  displayName,
  email,
  bio,
  photoUrl,
  bannerUrl,
  previewAvatar,
  previewBanner,
  saving,
  error,
  saved,
  avatarInputRef,
  bannerInputRef,
  onPickAvatar,
  onRemoveAvatar,
  onPickBanner,
  onRemoveBanner,
  onChangeDisplayName,
  onChangeBio,
  onSave,
  profilePath,
}) {
  return (
    <div className="space-y-4">
      <Card>

        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Profile</div>

          <Link
            to={profilePath}
            className="text-white text-sm"
          >
            View my profile
          </Link>
        </div>

        {/* Banner */}
        <section className="space-y-1">
          <label className="text-xs text-zinc-300">Avatar banner</label>

          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <div className="relative w-full h-32 sm:h-40 md:h-48">
              <img
                src={previewBanner || bannerUrl || '/default-banner.jpg'}
                alt="avatar banner"
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
              PNG/JPG ≤ 5MB
            </span>
          </div>
        </section>

        {/* Avatar */}
        <section className="mt-4 space-y-1">
          <label className="text-xs text-zinc-300">Avatar photo</label>

          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-zinc-800">
              {(previewAvatar || photoUrl) ? (
                <img
                  src={previewAvatar || photoUrl}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : null}
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
            </div>
          </div>
        </section>

        {/* Username */}
        <section className="mt-4 space-y-1">
          <label className="text-xs text-zinc-400">Username</label>
          <input
            value={username ? `@${username}` : '—'}
            disabled
            readOnly
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-2"
          />
        </section>

        {/* Display Name */}
        <section className="mt-3 space-y-1">
          <label className="text-xs text-zinc-300">Display name</label>
          <input
            value={displayName}
            onChange={(e) => onChangeDisplayName(e.target.value)}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white px-3 py-2"
            disabled={saving}
          />
        </section>

        {/* Email */}
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

        {/* Bio */}
        <section className="mt-3 space-y-1">
          <label className="text-xs text-zinc-300">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => onChangeBio(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white px-3 py-2 resize-y"
            disabled={saving}
          />
        </section>

        {error && (
          <div className="mt-3 rounded-lg bg-red-950/60 border border-red-900 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {saved && !saving && (
          <div className="mt-3 text-sm text-green-400">
            ✓ Changes saved
          </div>
        )}

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

      <ProfessionalAccessButton />
    </div>
  )
}
