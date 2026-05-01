import { useCallback, useEffect, useState } from 'react'
import { useVportAccountOps } from '@/features/settings/adapters/settings.adapter'

export function useRestoreVport(actorId) {
  const { resolveVportIdByActorId, restoreVport } = useVportAccountOps()
  const [vportId, setVportId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!actorId) return
    resolveVportIdByActorId(actorId)
      .then(setVportId)
      .catch(() => {})
  }, [actorId])

  const restore = useCallback(async () => {
    if (!vportId) return
    setBusy(true)
    setErr('')
    try {
      await restoreVport({ vportId })
    } catch (e) {
      const message = e?.message || 'Could not restore VPORT. Try again.'
      setErr(message)
      throw e
    } finally {
      setBusy(false)
    }
  }, [vportId])

  return { vportId, busy, err, restore }
}
