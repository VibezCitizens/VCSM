import { normalizeGasError } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasErrorMessages";

export function GasStates({
  loading = false,
  error = null,
  empty = false,
  emptyText = "No gas prices yet.",
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`gas-skel:${i}`} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--vc-card-bg)' }}>
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg" style={{ background: 'rgba(139,92,246,0.08)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.1)' }} />
              <div className="h-2 w-16 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.06)' }} />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-md" style={{ background: 'rgba(139,92,246,0.08)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="profiles-error rounded-2xl p-4 text-sm">
        {normalizeGasError(error)}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="profiles-subcard p-4 text-sm profiles-muted">
        {emptyText}
      </div>
    );
  }

  return null;
}
