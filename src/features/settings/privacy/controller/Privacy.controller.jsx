// src/features/settings/privacy/controller/Privacy.controller.jsx
import { useMemo } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

const DBG = true
const dlog = (...a) => DBG && console.debug('[Privacy]', ...a)

export function usePrivacyController() {
  const { user } = useAuth()
  const { identity } = useIdentity()

  const isVport = identity?.kind === 'vport' && !!identity?.vportId

  const actorId = identity?.actorId || null
  const vportId = identity?.vportId || null
  const userId = user?.id || null

  const actorProps = useMemo(() => {
    const base = isVport
      ? { scope: 'vport', vportId, actorId }
      : { scope: 'user', userId, actorId }

    dlog('actorProps', base)
    return base
  }, [isVport, vportId, userId, actorId])

  return {
    ready: !!actorId,
    isVport,
    actorProps,
  }
}
