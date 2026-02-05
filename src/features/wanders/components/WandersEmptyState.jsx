// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersEmptyState.jsx
// ============================================================================
// WANDERS COMPONENT — EMPTY STATE
// UI-only reusable empty state.
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
        'w-full rounded-2xl border border-gray-200 bg-white p-8 text-center',
        className,
      ].join(' ')}
    >
      {icon ? <div className="mx-auto mb-3 flex justify-center">{icon}</div> : null}

      <div className="text-base font-semibold text-gray-900">{title}</div>

      {description ? (
        <div className="mt-2 text-sm text-gray-600">{description}</div>
      ) : null}

      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export default WandersEmptyState
