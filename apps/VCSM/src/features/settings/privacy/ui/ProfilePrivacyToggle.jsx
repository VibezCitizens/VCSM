import { useActorPrivacy } from '@/features/settings/privacy/hooks/useActorPrivacy'
import { useTranslation } from '@i18n'

export default function ProfilePrivacyToggle({ actorId }) {
  const { loading, isPrivate, error, togglePrivacy } = useActorPrivacy(actorId)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={togglePrivacy}
        disabled={loading}
        aria-pressed={isPrivate}
        className={`settings-toggle ${isPrivate ? 'is-private' : 'is-public'} ${
          loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <span className="settings-toggle-knob" />
      </button>

      <div className="text-[11px] text-white/50">
        {loading ? t('settings.loading') : isPrivate ? t('settings.privacy.private') : t('settings.privacy.public')}
      </div>

      {error && <div className="max-w-[180px] text-right text-[11px] text-rose-300">{error}</div>}
    </div>
  )
}
