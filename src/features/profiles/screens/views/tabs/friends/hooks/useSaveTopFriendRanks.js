import { useCallback, useState } from 'react'

import { saveTopFriendRanksController } from '@/features/profiles/screens/views/tabs/friends/controller/saveTopFriendRanks.controller'

export function useSaveTopFriendRanks() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const save = useCallback(async ({ ownerActorId, actorIds, autofill = false, maxCount = 10 }) => {
    setSaving(true)
    setError(null)

    try {
      const result = await saveTopFriendRanksController({
        ownerActorId,
        friendActorIds: actorIds,
        autofill,
        maxCount,
      })

      if (!result?.ok) {
        throw result?.error || new Error('Failed to save top friends')
      }

      return {
        ok: true,
        actorIds: result?.data?.actorIds ?? [],
      }
    } catch (err) {
      setError(err)
      return {
        ok: false,
        actorIds: [],
        error: err,
      }
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    save,
    saving,
    error,
  }
}

