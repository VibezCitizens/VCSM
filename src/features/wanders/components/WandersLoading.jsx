// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersLoading.jsx
// ============================================================================
// WANDERS COMPONENT — LOADING
// UI-only loading state.
// ============================================================================

import React from 'react'

/**
 * @param {{ label?: string, className?: string }} props
 */
export function WandersLoading({ label = 'Loading…', className = '' }) {
  return (
    <div className={['flex items-center justify-center py-12 text-sm opacity-70', className].join(' ')}>
      {label}
    </div>
  )
}

export default WandersLoading
