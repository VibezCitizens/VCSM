// src/features/settings/privacy/controller/Privacy.controller.jsx
import { useMemo } from 'react'
import { useIdentity } from '@/state/identity/identityContext'

const DBG = true
const dlog = (...a) => DBG && console.debug('[Privacy]', ...a)

export function usePrivacyController() {
  const { identity } = useIdentity()

  // ✅ ACTOR-FIRST (no identity.vportId)
  const isVport = identity?.kind === 'vport'

  const actorId = identity?.actorId || null

  const actorProps = useMemo(() => {
    if (!actorId) return null

    const base = {
      scope: isVport ? 'vport' : 'user',
      actorId,
    }

    dlog('actorProps', base)
    return base
  }, [isVport, actorId])

  return {
    ready: !!actorId,
    isVport,
    actorProps,
  }
}