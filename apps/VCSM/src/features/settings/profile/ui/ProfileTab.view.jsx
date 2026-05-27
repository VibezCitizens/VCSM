import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useTranslation } from '@i18n'
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
  busyAvatar,
  busyBanner,
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
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">{t('settings.profile.heading')}</div>
          <Link to={profilePath} className="text-sm text-purple-300 hover:text-purple-300">
            {t('settings.profile.viewMyProfile')}
          </Link>
        </div>

        <section className="space-y-1">
          <label className="text-xs text-white/70">{t('settings.profile.avatarBanner')}</label>
          <div className="overflow-hidden rounded-xl border border-white/12 bg-white/4/50">
            <div className="relative h-32 w-full sm:h-40 md:h-48">
              <img
                src={previewBanner || bannerUrl || '/default-banner.jpg'}
                alt="avatar banner"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={onPickBanner} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
              disabled={saving || busyBanner}
            >
              {t('settings.profile.chooseBanner')}
            </button>
            {(previewBanner || bannerUrl) && (
              <button
                type="button"
                onClick={onRemoveBanner}
                className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
                disabled={saving || busyBanner}
              >
                {t('actions.remove')}
              </button>
            )}
            <span className="text-[11px] text-white/40">{t('settings.profile.fileSizeHint')}</span>
          </div>
        </section>

        <section className="mt-4 space-y-1">
          <label className="text-xs text-white/70">{t('settings.profile.avatarPhoto')}</label>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/6">
              {(previewAvatar || photoUrl) ? (
                <img src={previewAvatar || photoUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
                disabled={saving || busyAvatar}
              >
                {t('settings.profile.chooseImage')}
              </button>
              {(previewAvatar || photoUrl) && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  className="settings-btn settings-btn--ghost px-3 py-1.5 text-sm"
                  disabled={saving || busyAvatar}
                >
                  {t('actions.remove')}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 space-y-1">
          <label className="inline-flex items-center gap-1.5 text-xs text-white/50">
            {t('settings.profile.username')}
            <Lock size={12} className="text-white/50" aria-hidden="true" />
          </label>
          <div className="relative">
            <input
              value={username ? `@${username}` : '-'}
              disabled
              readOnly
              className="settings-input w-full rounded-xl px-3 py-2 pr-9 text-white/50"
            />
            <Lock
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
              aria-hidden="true"
            />
          </div>
        </section>

        <section className="mt-3 space-y-1">
          <label className="text-xs text-white/70">{t('settings.profile.displayName')}</label>
          <input
            value={displayName}
            onChange={(e) => onChangeDisplayName(e.target.value)}
            className="settings-input w-full rounded-xl px-3 py-2"
            disabled={saving}
          />
        </section>

        {email && (
          <section className="mt-3 space-y-1">
            <label className="inline-flex items-center gap-1.5 text-xs text-white/50">
              {t('auth.email')}
              <Lock size={12} className="text-white/50" aria-hidden="true" />
            </label>
            <div className="relative">
              <input
                value={email}
                disabled
                readOnly
                className="settings-input w-full rounded-xl px-3 py-2 pr-9 text-white/50"
              />
              <Lock
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                aria-hidden="true"
              />
            </div>
          </section>
        )}

        <section className="mt-3 space-y-1">
          <label className="text-xs text-white/70">{t('settings.profile.bio')}</label>
          <textarea
            value={bio}
            onChange={(e) => onChangeBio(e.target.value)}
            rows={4}
            className="settings-input w-full resize-y rounded-xl px-3 py-2"
            disabled={saving}
          />
        </section>

        {error && <div className="mt-3 rounded-lg border border-rose-300/25 bg-rose-950/35 px-3 py-2 text-sm text-rose-100">{error}</div>}
        {saved && !saving && <div className="mt-3 text-sm text-emerald-300">{t('settings.profile.changesSaved')}</div>}

        <div className="mt-4 flex justify-end">
          <button onClick={onSave} disabled={saving} className="settings-btn settings-btn--primary px-4 py-2 text-sm font-semibold">
            {saving ? t('settings.profile.saving') : t('actions.save')}
          </button>
        </div>
      </Card>

      <ProfessionalAccessButton />
    </div>
  )
}
