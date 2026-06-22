import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { ctrlSetActorPrivacy } from '@/features/settings/privacy/controller/actorPrivacy.controller'
import { useIdentityOps } from '@/features/identity/adapters/identity.adapter'

/**
 * Mutation to toggle actor privacy (public/private).
 * On success invalidates privacy settings + vports list so both tabs see fresh state.
 *
 * @param {{ actorId: string, userId?: string }} params
 */
export function useUpdateVportVisibility({ actorId, userId, callerActorId } = {}) {
  const qc = useQueryClient()
  const { refreshVcActorDirectory } = useIdentityOps()

  return useMutation({
    mutationFn: (isPrivate) => ctrlSetActorPrivacy({ actorId, callerActorId, isPrivate, refreshActorFn: refreshVcActorDirectory }),
    onMutate: async (isPrivate) => {
      const key = queryKeys.settingsPrivacy(actorId)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData(key)
      qc.setQueryData(key, isPrivate)
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev !== undefined) {
        qc.setQueryData(queryKeys.settingsPrivacy(actorId), context.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settingsPrivacy(actorId) })
      if (userId) {
        qc.invalidateQueries({ queryKey: queryKeys.settingsVports(userId) })
      }
    },
  })
}
