import { useEffect } from 'react'
import { useIdentity } from '@/state/identity/identityContext'
import useNotificationsInternal from './useNotificationsInternal'

export default function useNotifications() {
  const { identity } = useIdentity()
  const { rows, loading, reload } =
    useNotificationsInternal(identity)

  useEffect(() => {
    const onRefresh = () => reload?.()
    window.addEventListener('noti:reload', onRefresh)
    return () => window.removeEventListener('noti:reload', onRefresh)
  }, [reload])

  return { rows, loading, reload }
}
