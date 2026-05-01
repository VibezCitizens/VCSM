import { useEffect, useState } from 'react'
import { resolveVportSlugController } from '../controller/resolveVportSlug.controller'

export function useResolveVportSlug(slug) {
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

    resolveVportSlugController(slug)
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
