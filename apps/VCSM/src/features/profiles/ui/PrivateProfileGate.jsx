// src/features/profiles/ui/PrivateProfileGate.jsx
import { useTranslation } from '@i18n'

export default function PrivateProfileGate({
  actor: _actor,
  onRequestFollow: _onRequestFollow,
  canMessage = false,
}) {
  const { t } = useTranslation()

  return (
    <div className="flex justify-center px-4 py-8">
      <div className="profiles-card relative w-full max-w-md overflow-hidden rounded-2xl p-5">
        <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-12 h-36 w-36 rounded-full bg-purple-400/8 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-100">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-200" />
            {t('profile.privateGate.badge')}
          </div>

          <div className="mt-3 text-sm font-semibold text-white">{t('profile.privateGate.title')}</div>
          <div className="mt-1 text-xs text-white/50">
            {t('profile.privateGate.subtitle')}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs leading-5 text-white/70">
              {t('profile.privateGate.instructionBefore')}{' '}
              <span className="font-semibold text-white">{t('profile.actions.subscribe')}</span>
              {' '}{t('profile.privateGate.instructionAfter')}
            </p>
          </div>

          {canMessage && (
            <div className="mt-3 text-center text-[11px] text-white/40">
              {t('profile.privateGate.messagingPending')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
