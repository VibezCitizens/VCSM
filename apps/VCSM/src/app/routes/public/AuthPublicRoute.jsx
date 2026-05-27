import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'
import { useAuth } from '@/app/providers/AuthProvider'

export default function AuthPublicRoute({ children }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    hideLaunchSplash()
  }, [])

  if (loading) {
    return null
  }

  if (user) {
    return <Navigate to="/feed" replace />
  }

  return children
}
