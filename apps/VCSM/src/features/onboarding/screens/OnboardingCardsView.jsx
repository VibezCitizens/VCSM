import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentity } from '@/state/identity/identityContext'
import useOnboardingCards from '@/features/onboarding/hooks/useOnboardingCards'
import OnboardingCardList from '@/features/onboarding/components/OnboardingCardList'

function OnboardingCardsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`onboarding-skeleton:${i}`}
          className="rounded-2xl border border-white/10 p-4"
          style={{ background: 'var(--vc-card-bg)' }}
        >
          <div className="space-y-3">
            <div className="h-4 w-44 animate-pulse rounded" style={{ background: 'rgba(139, 92, 246, 0.1)' }} />
            <div className="h-3.5 w-11/12 animate-pulse rounded" style={{ background: 'rgba(139, 92, 246, 0.07)' }} />
            <div className="h-2 w-full animate-pulse rounded" style={{ background: 'rgba(139, 92, 246, 0.05)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function resolveCardRoute(card) {
  if (!card) return ''
  if (card.key === 'complete_citizen_card') return '/settings?tab=profile'
  return String(card.ctaPath || '').trim()
}

export default function OnboardingCardsView() {
  const navigate = useNavigate()
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null

  const { cards, loading, error, refresh } = useOnboardingCards(actorId)

  const totalCount = cards.length
  const completedCount = useMemo(
    () => cards.filter((card) => card.status === 'completed').length,
    [cards]
  )
  const completionRatio = useMemo(
    () => (totalCount > 0 ? completedCount / totalCount : 0),
    [completedCount, totalCount]
  )
  const completionPercent = Math.round(completionRatio * 100)
  const allCompleted = totalCount > 0 && completedCount === totalCount

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-2 pb-4">
        <section
          className="relative overflow-hidden rounded-[26px] border border-white/10 p-4"
          style={{ background: 'var(--vc-card-bg)', boxShadow: 'var(--vc-shadow-elevated)' }}
        >
          <OnboardingCardsSkeleton count={3} />
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-2 pb-4">
        <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-4 text-sm text-[#fecaca]">
          Failed to load onboarding cards.
        </div>
        <button
          type="button"
          onClick={refresh}
          className="mt-3 rounded-xl px-3 py-2 text-xs"
          style={{ background: 'var(--vc-surface-input)', color: 'var(--vc-text-soft)' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!cards.length) return null
  if (allCompleted) return null

  return (
    <div className="mx-auto w-full max-w-2xl px-2 pb-4">
      <section
        className="relative overflow-hidden rounded-[26px] border border-white/10"
        style={{ background: 'var(--vc-card-bg)', boxShadow: 'var(--vc-shadow-elevated)' }}
      >
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl" style={{ background: 'rgba(139, 92, 246, 0.15)' }} />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full blur-3xl" style={{ background: 'rgba(139, 92, 246, 0.08)' }} />

        <header className="relative z-10 border-b border-white/8 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--vc-text)' }}>
                Get started
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--vc-text-soft)' }}>
                Complete these steps to unlock your full Vibez experience.
              </p>
            </div>

            <div
              className="relative h-14 w-14 shrink-0 rounded-full p-[3px]"
              style={{
                background: `conic-gradient(rgba(139,92,246,0.92) ${completionRatio * 360}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
              aria-label={`${completedCount} of ${totalCount} completed`}
            >
              <div
                className="flex h-full w-full items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--vc-bg-0)', color: 'var(--vc-text-soft)' }}
              >
                {completionPercent}%
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
            {cards.map((card) => {
              const segmentProgress = card.status === 'completed'
                ? 100
                : Math.round(Math.max(0, Math.min(1, Number(card.progress ?? 0))) * 100)

              return (
                <div
                  key={`segment:${card.key}`}
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255, 255, 255, 0.06)' }}
                >
                  <span
                    className="block h-full rounded-full transition-[width,background-color] duration-500 ease-out"
                    style={{
                      width: `${segmentProgress}%`,
                      background: card.status === 'completed'
                        ? 'var(--vc-success)'
                        : segmentProgress > 0
                        ? 'var(--vc-accent-primary)'
                        : 'rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
              )
            })}
          </div>

          <p className="mt-2 text-xs" style={{ color: 'var(--vc-text-muted)' }}>
            {completedCount} of {totalCount} completed
          </p>
        </header>

        <div className="relative z-10 p-4">
          <OnboardingCardList
            cards={cards}
            onPressAction={(card) => {
              const route = resolveCardRoute(card)
              if (!route) return
              navigate(route)
            }}
          />
        </div>
      </section>
    </div>
  )
}
