import { useEffect, useState } from 'react'
import { getActorVibeTagsController } from '@/features/profiles/adapters/tags/actorVibeTags.adapter'

export function useActorVibeTags(actorId) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function run() {
      if (!actorId) {
        if (!active) return
        setTags([])
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await getActorVibeTagsController({ actorId })
        if (!active) return

        if (!result?.ok) {
          throw new Error(result?.error?.message || 'Failed to load vibe tags')
        }

        setTags(result?.data?.tags ?? [])
      } catch (err) {
        if (!active) return
        console.error('[profiles/tags] failed to load actor vibe tags', {
          actorId,
          message: err?.message ?? null,
          code: err?.code ?? null,
          details: err?.details ?? null,
          hint: err?.hint ?? null,
          error: err,
        })
        setTags([])
        setError(err)
      } finally {
        if (active) setLoading(false)
      }
    }

    run()

    return () => {
      active = false
    }
  }, [actorId])

  return {
    tags,
    loading,
    error,
  }
}
