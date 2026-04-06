// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import { Navigate, useLocation } from 'react-router-dom'
import { useCompleteProfileGate } from '@/features/auth/hooks/useCompleteProfileGate'

export default function CompleteProfileGate({ children }) {
  const location = useLocation()
  const { loading, needsOnboarding } = useCompleteProfileGate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-zinc-300">Loading…</div>
      </div>
    )
  }

  if (needsOnboarding) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  return <>{children}</>
}
