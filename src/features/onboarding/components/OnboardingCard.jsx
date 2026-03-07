import { ArrowRight, CheckCircle2 } from 'lucide-react'

function defaultHelperText(card, {
  isCompleted,
  isInProgress,
  isActionOnly,
  progressPercent,
}) {
  if (isCompleted) return 'Completed'
  if (card?.helperText) return card.helperText
  if (isActionOnly) return 'Take this action to unlock your next onboarding milestone.'
  if (isInProgress) return `${progressPercent}% complete`
  return 'Start this step to keep onboarding moving.'
}

export default function OnboardingCard({
  card,
  onPressAction,
}) {
  if (!card) return null

  const progress = Math.max(0, Math.min(1, Number(card.progress ?? 0)))
  const progressPercent = Math.round(progress * 100)
  const progressLabel = `${progressPercent}% complete`
  const isCompleted = card.status === 'completed'
  const isActionOnly = card.progressMode === 'action'
  const isInProgress = !isCompleted && !isActionOnly && progress > 0
  const helperText = defaultHelperText(card, {
    isCompleted,
    isInProgress,
    isActionOnly,
    progressPercent,
  })
  const checklist = Array.isArray(card?.checklist) ? card.checklist : []

  return (
    <article
      className={[
        'group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(15,23,42,0.95)]',
        isCompleted
          ? 'border-emerald-400/25 bg-emerald-500/[0.07] shadow-[0_8px_22px_-16px_rgba(16,185,129,0.45)]'
          : 'border-white/10 bg-white/[0.04] shadow-[0_10px_24px_-18px_rgba(2,6,23,0.95)] backdrop-blur-xl',
      ].join(' ')}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/[0.04] via-transparent to-indigo-400/[0.08]" />

      <div className="flex items-start gap-3">
        <div
          className={[
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
            isCompleted
              ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-200'
              : isInProgress
              ? 'border-indigo-300/60 bg-indigo-400/20 text-indigo-100'
              : 'border-slate-500/40 bg-slate-800/70 text-slate-300',
          ].join(' ')}
          aria-hidden="true"
        >
          {isCompleted ? (
            <CheckCircle2 size={15} className="transition-all duration-300 group-hover:scale-110" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-current" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={[
                  'truncate text-[15px] font-semibold tracking-tight transition-colors',
                  isCompleted ? 'text-slate-200/90' : 'text-slate-100',
                ].join(' ')}
              >
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-slate-300/90">{card.description}</p>
            </div>

            {isCompleted ? (
              <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                Completed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onPressAction?.(card)}
                className={[
                  'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium',
                  'transition-all duration-200 hover:-translate-y-0.5',
                  'border-indigo-300/45 bg-indigo-500/25 text-indigo-100 hover:bg-indigo-500/35',
                ].join(' ')}
              >
                {card.ctaLabel || 'Continue'}
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          <p
            className={[
              'mt-2 text-[12px] leading-5',
              isCompleted ? 'text-emerald-200/85' : 'text-slate-400',
            ].join(' ')}
          >
            {helperText}
          </p>

          {checklist.length > 0 && (
            <ul className="mt-2 space-y-1.5" aria-label="Profile completion checklist">
              {checklist.map((item) => {
                const done = item?.isCompleted === true
                return (
                  <li
                    key={String(item?.key || item?.label)}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <span
                      className={[
                        'inline-flex h-4 w-4 items-center justify-center rounded-full border',
                        done
                          ? 'border-emerald-300/70 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-500/50 bg-slate-800/80 text-slate-400',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {done ? <CheckCircle2 size={11} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span className={done ? 'text-emerald-100/90' : 'text-slate-300/90'}>
                      {item?.label || item?.key}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}

          {!isActionOnly && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/75">
                <div
                  className={[
                    'h-full rounded-full transition-[width,background-color] duration-500 ease-out',
                    isCompleted
                      ? 'bg-emerald-400/95'
                      : isInProgress
                      ? 'bg-indigo-300/95'
                      : 'bg-slate-500/55',
                  ].join(' ')}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{progressLabel}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
