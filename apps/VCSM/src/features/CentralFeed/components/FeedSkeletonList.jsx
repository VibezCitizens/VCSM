export function FeedSkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`feed-skeleton:${i}`}
          className="profiles-card overflow-hidden rounded-2xl"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-10 w-10 animate-pulse rounded-xl" style={{ background: 'rgba(139,92,246,0.08)' }} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.1)' }} />
              <div className="h-2 w-20 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.07)' }} />
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4">
            <div className="h-3 w-11/12 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.08)' }} />
            <div className="h-3 w-8/12 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.06)' }} />
            <div className="mt-3 h-44 animate-pulse rounded-xl" style={{ background: 'rgba(139,92,246,0.04)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
