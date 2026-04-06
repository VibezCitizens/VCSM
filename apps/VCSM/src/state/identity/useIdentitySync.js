// src/state/identity/useIdentitySync.js

import { useEffect } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from './identityContext'
import { saveIdentity } from './identityStorage'

export default function useIdentitySync() {
  const { user } = useAuth() || {}
  const { identity } = useIdentity()

  useEffect(() => {
    if (!identity?.actorId) return
    saveIdentity(identity.actorId, user?.id)
  }, [identity?.actorId, user?.id])
}
