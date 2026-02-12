// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersLoading.jsx
// ============================================================================
// WANDERS COMPONENT — LOADING
// UI-only loading state (dark glass + spinner to match Wanders UI).
// ============================================================================

import React from 'react'

/**
 * @param {{ label?: string, className?: string }} props
 */
export function WandersLoading({ label = 'Loading…', className = '' }) {
  return (
    <div className={['flex items-center justify-center py-12', className].join(' ')}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <span
          className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
          aria-hidden
        />
        <span className="text-sm font-semibold text-white/80">{label}</span>
      </div>
    </div>
  )
}

export default WandersLoading
