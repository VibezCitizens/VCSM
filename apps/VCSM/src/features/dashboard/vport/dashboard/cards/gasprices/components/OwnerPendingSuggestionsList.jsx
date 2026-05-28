import { OwnerSuggestionReviewCard } from "@/features/dashboard/vport/dashboard/cards/gasprices/components/OwnerSuggestionReviewCard";

export function OwnerPendingSuggestionsList({
  submissions = [],
  officialByFuelKey = {},
  onApprove,
  onReject,
  reviewing = false,
}) {
  if (!submissions?.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm text-white/50">
        No pending suggestions.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((s) => (
        <OwnerSuggestionReviewCard
          key={s.id}
          submission={s}
          officialPrice={officialByFuelKey?.[s.fuelKey] ?? null}
          onApprove={onApprove}
          onReject={onReject}
          reviewing={reviewing}
        />
      ))}
    </div>
  );
}