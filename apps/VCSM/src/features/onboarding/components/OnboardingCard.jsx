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
      className="group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        borderColor: isCompleted ? 'rgba(34, 197, 94, 0.2)' : 'var(--vc-border)',
        background: isCompleted ? 'rgba(34, 197, 94, 0.05)' : 'var(--vc-card-bg)',
        boxShadow: 'var(--vc-shadow-card)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
          style={{
            borderColor: isCompleted
              ? 'rgba(34, 197, 94, 0.5)'
              : isInProgress
              ? 'rgba(139, 92, 246, 0.45)'
              : 'rgba(255, 255, 255, 0.12)',
            background: isCompleted
              ? 'rgba(34, 197, 94, 0.15)'
              : isInProgress
              ? 'rgba(139, 92, 246, 0.15)'
              : 'var(--vc-surface-input)',
            color: isCompleted
              ? '#86efac'
              : isInProgress
              ? 'var(--vc-accent-primary-hover)'
              : 'var(--vc-text-muted)',
          }}
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
                className="truncate text-[15px] font-semibold tracking-tight transition-colors"
                style={{ color: isCompleted ? 'var(--vc-text-soft)' : 'var(--vc-text)' }}
              >
                {card.title}
              </h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--vc-text-soft)' }}>
                {card.description}
              </p>
            </div>

            {isCompleted ? (
              <span
                className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                style={{
                  borderColor: 'rgba(34, 197, 94, 0.35)',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#86efac',
                }}
              >
                Completed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onPressAction?.(card)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: 'rgba(139, 92, 246, 0.35)',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--vc-accent-primary-hover)',
                }}
              >
                {card.ctaLabel || 'Continue'}
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          <p
            className="mt-2 text-[12px] leading-5"
            style={{ color: isCompleted ? '#86efac' : 'var(--vc-text-muted)' }}
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
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full border"
                      style={{
                        borderColor: done ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.12)',
                        background: done ? 'rgba(34, 197, 94, 0.15)' : 'var(--vc-surface-input)',
                        color: done ? '#86efac' : 'var(--vc-text-muted)',
                      }}
                      aria-hidden="true"
                    >
                      {done ? <CheckCircle2 size={11} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span style={{ color: done ? '#86efac' : 'var(--vc-text-soft)' }}>
                      {item?.label || item?.key}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}

          {!isActionOnly && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
                <div
                  className="h-full rounded-full transition-[width,background-color] duration-500 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    background: isCompleted
                      ? 'var(--vc-success)'
                      : isInProgress
                      ? 'var(--vc-accent-primary)'
                      : 'rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--vc-text-muted)' }}>
                {progressLabel}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
