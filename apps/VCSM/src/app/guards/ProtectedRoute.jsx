// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'
import { useLegalConsent } from '@/features/legal/hooks/useLegalConsent'
import ConsentGateScreen from '@/features/legal/screens/ConsentGateScreen'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { loading: consentLoading, requiresConsent, requiredActions, accepting, error, acceptAll } = useLegalConsent()

  if (loading) return null
  if (!user) {
    hideLaunchSplash()
    return <Navigate to="/login" replace />
  }

  if (consentLoading) return null
  if (requiresConsent) {
    return (
      <ConsentGateScreen
        requiredActions={requiredActions}
        accepting={accepting}
        error={error}
        onAccept={acceptAll}
      />
    )
  }

  return <Outlet />
}
