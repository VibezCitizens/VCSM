// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\OwnerPendingSuggestionsList.jsx

import { OwnerSuggestionReviewCard } from "@/features/profiles/kinds/vport/screens/gas/components/OwnerSuggestionReviewCard";

export function OwnerPendingSuggestionsList({
  submissions = [],
  officialByFuelKey = {},
  onApprove,
  onReject,
  reviewing = false,
}) {
  if (!submissions?.length) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-400">
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