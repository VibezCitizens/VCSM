// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'
import { useLegalConsent, ConsentGateScreen } from '@/features/legal/adapters/legal.adapter'
import { useEmailVerified, VerifyEmailRequiredScreen } from '@/features/auth/adapters/auth.adapter'
import { appendIOSProdDebugLog } from '@/shared/lib/iosProdDebugger'

export default function ProtectedRoute() {
  const { user, loading, logout } = useAuth()
  const { loading: consentLoading, requiresConsent, requiredActions, accepting, error, acceptAll, gateError, retryConsent } = useLegalConsent()
  const isEmailVerified = useEmailVerified(user)

  useEffect(() => {
    appendIOSProdDebugLog('protected_route_state', {
      loading,
      userId: user?.id ?? null,
      consentLoading,
      requiresConsent,
      requiredActionsCount: Array.isArray(requiredActions) ? requiredActions.length : 0,
      accepting,
      hasError: !!error,
      hasGateError: !!gateError,
    })
  }, [loading, user?.id, consentLoading, requiresConsent, requiredActions, accepting, error, gateError])

  if (loading) return null
  if (!user) {
    appendIOSProdDebugLog('protected_route_redirect_login', {
      reason: 'missing_user',
    })
    hideLaunchSplash()
    return <Navigate to="/login" replace />
  }

  if (!isEmailVerified) {
    appendIOSProdDebugLog('protected_route_email_unverified', {
      userId: user.id ?? null,
    })
    hideLaunchSplash()
    return <VerifyEmailRequiredScreen email={user.email ?? ''} />
  }

  if (consentLoading) return null
  if (requiresConsent) {
    appendIOSProdDebugLog('protected_route_show_consent_gate', {
      requiredActionsCount: Array.isArray(requiredActions) ? requiredActions.length : 0,
    })
    return (
      <ConsentGateScreen
        requiredActions={requiredActions}
        accepting={accepting}
        error={error}
        onAccept={acceptAll}
        gateError={gateError}
        onRetry={retryConsent}
        loading={consentLoading}
        onLogout={logout}
      />
    )
  }

  return <Outlet />
}
