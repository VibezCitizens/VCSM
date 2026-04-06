import OnboardingCard from '@/features/onboarding/components/OnboardingCard'

export default function OnboardingCardList({
  cards = [],
  onPressAction,
}) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 text-sm text-slate-400">
        No onboarding cards yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <OnboardingCard
          key={card.key}
          card={card}
          onPressAction={onPressAction}
        />
      ))}
    </div>
  )
}
