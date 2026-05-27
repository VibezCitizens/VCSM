import { useEffect, useState } from 'react'
import { resolveMenuSlugController } from '@/features/public/vportMenu/controller/resolveMenuSlug.controller'

export function useResolveMenuSlug(slug) {
  const [actorId, setActorId] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let alive = true
    setActorId(null)
    setNotFound(false)

    if (!slug) {
      setNotFound(true)
      return
    }

    resolveMenuSlugController(slug)
      .then((result) => {
        if (!alive) return
        if (result?.actorId) setActorId(result.actorId)
        else setNotFound(true)
      })
      .catch(() => { if (alive) setNotFound(true) })

    return () => { alive = false }
  }, [slug])

  return { actorId, notFound }
}
