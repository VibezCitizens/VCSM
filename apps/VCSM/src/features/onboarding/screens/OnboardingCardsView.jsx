import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Compass } from 'lucide-react'
import { useIdentity } from '@/state/identity/identityContext'
import useOnboardingCards from '@/features/onboarding/hooks/useOnboardingCards'
import OnboardingCardList from '@/features/onboarding/components/OnboardingCardList'

function OnboardingCardsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`onboarding-skeleton:${i}`}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"
        >
          <div className="space-y-3">
            <div className="h-4 w-44 animate-pulse rounded bg-slate-700/50" />
            <div className="h-3.5 w-11/12 animate-pulse rounded bg-slate-700/40" />
            <div className="h-2 w-full animate-pulse rounded bg-slate-700/35" />
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
        <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 p-4 shadow-[0_20px_50px_-35px_rgba(2,6,23,0.95)]">
          <OnboardingCardsSkeleton count={3} />
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-2 pb-4">
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          Failed to load onboarding cards.
        </div>
        <button
          type="button"
          onClick={refresh}
          className="mt-3 rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-200"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!cards.length) return null

  return (
    <div className="mx-auto w-full max-w-2xl px-2 pb-4">
      <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 shadow-[0_24px_60px_-34px_rgba(2,6,23,0.95)]">
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />

        {!allCompleted && (
          <>
            <header className="relative z-10 border-b border-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-slate-100">
                    Get started
                  </h2>
                  <p className="mt-1 text-sm text-slate-300/95">
                    Complete these steps to unlock your full Vibez experience.
                  </p>
                </div>

                <div
                  className="relative h-14 w-14 shrink-0 rounded-full p-[3px]"
                  style={{
                    background: `conic-gradient(rgba(129,140,248,0.92) ${completionRatio * 360}deg, rgba(71,85,105,0.45) 0deg)`,
                  }}
                  aria-label={`${completedCount} of ${totalCount} completed`}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-slate-200">
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
                      className="h-1.5 overflow-hidden rounded-full bg-slate-800/90"
                    >
                      <span
                        className={[
                          'block h-full rounded-full transition-[width,background-color] duration-500 ease-out',
                          card.status === 'completed'
                            ? 'bg-emerald-300/95'
                            : segmentProgress > 0
                            ? 'bg-indigo-300/90'
                            : 'bg-slate-500/50',
                        ].join(' ')}
                        style={{ width: `${segmentProgress}%` }}
                      />
                    </div>
                  )
                })}
              </div>

              <p className="mt-2 text-xs text-slate-400">
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
          </>
        )}

        {allCompleted && (
          <div className="relative z-10 p-5">
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/[0.08] p-5 text-center shadow-[0_16px_35px_-20px_rgba(16,185,129,0.55)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/15 text-emerald-200">
                <CheckCircle2 size={22} className="animate-pulse" />
              </div>

              <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-100">
                🎉 You&apos;re all set!
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Your Vibez Citizen profile is ready. Start exploring the network.
              </p>

              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-300/45 bg-indigo-500/25 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-500/35"
              >
                <Compass size={15} />
                Explore Citizens
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
