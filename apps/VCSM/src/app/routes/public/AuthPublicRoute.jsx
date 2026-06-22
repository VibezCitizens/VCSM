import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'
import { useAuth } from '@/app/providers/AuthProvider'
import { authTheme } from '@/features/auth/adapters/auth.adapter'

export default function AuthPublicRoute({ children }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    hideLaunchSplash()
  }, [])

  // KRAVEN-LOGIN-M01 / LOKI-LS-02: returning null here produces a blank screen
  // on slow networks while auth hydration is running. Always show visible feedback.
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: authTheme.pageBackground }}
      >
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/CentralFeed" replace />
  }

  return children
}
