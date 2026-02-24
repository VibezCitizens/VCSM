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
          <div className="text-sm font-semibold text-slate-100">Profile</div>
          <Link to={profilePath} className="text-sm text-indigo-300 hover:text-indigo-200">
            View my profile
          </Link>
        </div>

        <section className="space-y-1">
          <label className="text-xs text-slate-300">Avatar banner</label>
          <div className="overflow-hidden rounded-xl border border-slate-300/20 bg-slate-900/50">
            <div className="relative h-32 w-full sm:h-40 md:h-48">
              <img
                src={previewBanner || bannerUrl || '/default-banner.jpg'}
                alt="avatar banner"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={onPickBanner} className="hidden" />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
              disabled={saving}
            >
              Choose banner
            </button>
            {(previewBanner || bannerUrl) && (
              <button
                type="button"
                onClick={onRemoveBanner}
                className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
                disabled={saving}
              >
                Remove
              </button>
            )}
            <span className="text-[11px] text-slate-500">PNG/JPG {'<='} 5MB</span>
          </div>
        </section>

        <section className="mt-4 space-y-1">
          <label className="text-xs text-slate-300">Avatar photo</label>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-800">
              {(previewAvatar || photoUrl) ? (
                <img src={previewAvatar || photoUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
                disabled={saving}
              >
                Choose image
              </button>
              {(previewAvatar || photoUrl) && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
                  disabled={saving}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 space-y-1">
          <label className="text-xs text-slate-400">Username</label>
          <input value={username ? `@${username}` : '-'} disabled readOnly className="settings-input w-full rounded-xl px-3 py-2 text-slate-400" />
        </section>

        <section className="mt-3 space-y-1">
          <label className="text-xs text-slate-300">Display name</label>
          <input
            value={displayName}
            onChange={(e) => onChangeDisplayName(e.target.value)}
            className="settings-input w-full rounded-xl px-3 py-2"
            disabled={saving}
          />
        </section>

        {email && (
          <section className="mt-3 space-y-1">
            <label className="text-xs text-slate-400">Email</label>
            <input value={email} disabled readOnly className="settings-input w-full rounded-xl px-3 py-2 text-slate-400" />
          </section>
        )}

        <section className="mt-3 space-y-1">
          <label className="text-xs text-slate-300">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => onChangeBio(e.target.value)}
            rows={4}
            className="settings-input w-full resize-y rounded-xl px-3 py-2"
            disabled={saving}
          />
        </section>

        {error && <div className="mt-3 rounded-lg border border-rose-300/25 bg-rose-950/35 px-3 py-2 text-sm text-rose-100">{error}</div>}
        {saved && !saving && <div className="mt-3 text-sm text-emerald-300">Changes saved</div>}

        <div className="mt-4 flex justify-end">
          <button onClick={onSave} disabled={saving} className="settings-btn settings-btn--primary px-4 py-2 text-sm font-semibold">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Card>

      <ProfessionalAccessButton />
    </div>
  )
}
