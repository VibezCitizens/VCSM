// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersEmptyState.jsx
// ============================================================================
// WANDERS COMPONENT — EMPTY STATE
// UI-only reusable empty state (dark glass style to match Wanders UI).
// ============================================================================

import React from 'react'

/**
 * @param {{
 *  title?: string,
 *  description?: string,
 *  icon?: React.ReactNode,
 *  action?: React.ReactNode,
 *  className?: string,
 * }} props
 */
export function WandersEmptyState({
  title = 'Nothing here yet',
  description = 'When something arrives, it will show up here.',
  icon = null,
  action = null,
  className = '',
}) {
  return (
    <div
      className={[
        'w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center',
        'shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md',
        className,
      ].join(' ')}
    >
      {icon ? (
        <div className="mx-auto mb-4 flex justify-center text-white/70">
          {icon}
        </div>
      ) : null}

      <div className="text-base font-semibold text-white">
        {title}
      </div>

      {description ? (
        <div className="mt-2 text-sm text-white/70">
          {description}
        </div>
      ) : null}

      {action ? (
        <div className="mt-5 flex justify-center">
          {action}
        </div>
      ) : null}
    </div>
  )
}

export default WandersEmptyState
