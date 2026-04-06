import { useEffect, useState } from 'react'
import { resolveUsernameToActor } from '@/features/profiles/controller/resolveUsernameToActor.controller'

export function useUsernameProfileRedirect(username) {
  const [actorId, setActorId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const id = await resolveUsernameToActor(username)
        if (alive) setActorId(id)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => { alive = false }
  }, [username])

  return { actorId, loading }
}
