import { OwnerPendingBatchCard } from "@/features/vportDashboard/dashboard/cards/gasprices/components/OwnerPendingBatchCard";

/**
 * Renders pending citizen submission batches as one card per batch.
 * Each card approves/rejects the whole batch through the secure RPC.
 */
export function OwnerPendingBatchList({
  batches = [],
  officialByFuelKey = {},
  onApproveAll,
  onRejectAll,
  reviewing = false,
}) {
  if (!batches?.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm text-white/50">
        No pending suggestions.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {batches.map((batch) => (
        <OwnerPendingBatchCard
          key={batch.submissionBatchId}
          batch={batch}
          officialByFuelKey={officialByFuelKey}
          onApproveAll={onApproveAll}
          onRejectAll={onRejectAll}
          reviewing={reviewing}
        />
      ))}
    </div>
  );
}
