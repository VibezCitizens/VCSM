/**
 * Reusable skeleton loading primitives.
 * Uses purple-tinted shimmer matching the --vc-* theme.
 *
 * Usage:
 *   <SkeletonBox className="h-10 w-10 rounded-xl" />
 *   <SkeletonLine className="w-32" />
 *   <SkeletonBlock className="h-44 rounded-xl" />
 */

const SHIMMER = 'animate-pulse'
const BASE = 'rgba(139, 92, 246, 0.08)'
const LIGHT = 'rgba(139, 92, 246, 0.06)'
const FAINT = 'rgba(139, 92, 246, 0.04)'

export function SkeletonBox({ className = '' }) {
  return (
    <div
      className={`${SHIMMER} ${className}`}
      style={{ background: BASE }}
    />
  )
}

export function SkeletonLine({ className = '', light = false }) {
  return (
    <div
      className={`${SHIMMER} h-3 rounded ${className}`}
      style={{ background: light ? LIGHT : BASE }}
    />
  )
}

export function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`${SHIMMER} ${className}`}
      style={{ background: FAINT }}
    />
  )
}

/**
 * Card-shaped skeleton with header (avatar + lines) and optional body block.
 */
export function SkeletonCard({ showBody = true, bodyHeight = 'h-32' }) {
  return (
    <div className="profiles-card overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 px-4 py-3">
        <SkeletonBox className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-20" light />
        </div>
      </div>
      {showBody && (
        <div className="space-y-2 px-4 pb-4">
          <SkeletonLine className="w-11/12" />
          <SkeletonLine className="w-8/12" light />
          <SkeletonBlock className={`mt-3 rounded-xl ${bodyHeight}`} />
        </div>
      )}
    </div>
  )
}

/**
 * List of skeleton cards.
 */
export function SkeletonCardList({ count = 3, showBody = true, bodyHeight = 'h-32', gap = 'space-y-3', className = '' }) {
  return (
    <div className={`${gap} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={`skel:${i}`} showBody={showBody} bodyHeight={bodyHeight} />
      ))}
    </div>
  )
}

/**
 * Row skeleton (for lists like notifications, services, bookings).
 */
export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${className}`} style={{ background: 'var(--vc-card-bg)' }}>
      <SkeletonBox className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonLine className="w-32" />
        <SkeletonLine className="w-52 max-w-[70vw]" light />
        <SkeletonLine className="w-16" light />
      </div>
      <SkeletonBox className="h-7 w-14 rounded-md" />
    </div>
  )
}

/**
 * Grid skeleton (for photos, portfolio).
 */
export function SkeletonGrid({ count = 6, cols = 'grid-cols-3', aspect = 'aspect-square' }) {
  return (
    <div className={`grid ${cols} gap-1`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={`grid-skel:${i}`} className={`${aspect} rounded-lg`} />
      ))}
    </div>
  )
}
