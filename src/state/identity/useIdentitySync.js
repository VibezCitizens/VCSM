// src/state/identity/useIdentitySync.js

import { useEffect } from 'react'
import { useIdentity } from './identityContext'
import { saveIdentity } from './identityStorage'

export default function useIdentitySync() {
  const { identity } = useIdentity()

  useEffect(() => {
    if (!identity?.actorId) return
    saveIdentity(identity.actorId)
  }, [identity?.actorId])
}
