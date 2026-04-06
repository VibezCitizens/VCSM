import { useEffect } from 'react'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'

export default function AuthPublicRoute({ children }) {
  useEffect(() => {
    hideLaunchSplash()
  }, [])

  return children
}
