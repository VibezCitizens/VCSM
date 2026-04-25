// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'
import { useLegalConsent } from '@/features/legal/hooks/useLegalConsent'
import ConsentGateScreen from '@/features/legal/screens/ConsentGateScreen'
import { isEmailVerifiedModel } from '@/features/auth/model/emailVerification.model'
import VerifyEmailRequiredScreen from '@/features/auth/screens/VerifyEmailRequiredScreen'
import { appendIOSProdDebugLog } from '@/shared/lib/iosProdDebugger'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { loading: consentLoading, requiresConsent, requiredActions, accepting, error, acceptAll } = useLegalConsent()

  useEffect(() => {
    appendIOSProdDebugLog('protected_route_state', {
      loading,
      userId: user?.id ?? null,
      consentLoading,
      requiresConsent,
      requiredActionsCount: Array.isArray(requiredActions) ? requiredActions.length : 0,
      accepting,
      hasError: !!error,
    })
  }, [loading, user?.id, consentLoading, requiresConsent, requiredActions, accepting, error])

  if (loading) return null
  if (!user) {
    appendIOSProdDebugLog('protected_route_redirect_login', {
      reason: 'missing_user',
    })
    hideLaunchSplash()
    return <Navigate to="/login" replace />
  }

  if (!isEmailVerifiedModel(user)) {
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
      />
    )
  }

  return <Outlet />
}
