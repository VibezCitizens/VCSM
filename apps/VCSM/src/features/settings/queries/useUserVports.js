import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { listMyVportsController } from '@/features/settings/vports/controller/listMyVports.controller'

export function useUserVports(userId) {
  const qc = useQueryClient()
  const key = queryKeys.settingsVports(userId)

  const query = useQuery({
    queryKey: key,
    queryFn: listMyVportsController,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const setItems = useCallback(
    (updater) =>
      qc.setQueryData(key, (prev) =>
        typeof updater === 'function' ? updater(prev ?? []) : updater
      ),
    [qc, key]
  )

  return {
    items: query.data ?? [],
    setItems,
    isLoading: query.isLoading,
  }
}
