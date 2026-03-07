// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) {
    hideLaunchSplash()
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
