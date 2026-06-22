import { useTranslation } from '@i18n'

export default function UnavailableProfileGate() {
  const { t } = useTranslation()

  return (
    <div className="flex justify-center px-4 py-8">
      <div className="profiles-card relative w-full max-w-md overflow-hidden rounded-2xl p-5">
        <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-12 h-36 w-36 rounded-full bg-rose-400/8 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
            {t('profile.unavailableGate.badge')}
          </div>

          <div className="mt-3 text-sm font-semibold text-white">
            {t('profile.unavailableGate.title')}
          </div>
          <div className="mt-1 text-xs text-white/50">
            {t('profile.unavailableGate.subtitle')}
          </div>
        </div>
      </div>
    </div>
  )
}
