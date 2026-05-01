import { useAuth } from '@/app/providers/AuthProvider'
import { useUserVports } from '@/features/settings/queries/useUserVports'

export function useVportsList() {
  const { user } = useAuth() || {}
  return useUserVports(user?.id)
}
