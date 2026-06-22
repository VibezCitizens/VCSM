import OnboardingCard from '@/features/initiation/components/OnboardingCard'

export default function OnboardingCardList({
  cards = [],
  onPressAction,
}) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 p-4 text-sm" style={{ background: 'var(--vc-card-bg)', color: 'var(--vc-text-muted)' }}>
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
