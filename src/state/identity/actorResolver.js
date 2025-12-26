// src/state/identity/actorResolver.js

import { useIdentity } from '@/state/identity/identityContext'
import {
  isUserActor,
  isVportActor,
  getActorId,
  getProfileId,
  getVportId,
  getDisplayName,
  getUsername,
  getAvatar,
  getBanner,
} from '@/state/identity/identitySelectors'

/* --------------------------------------------------------
   HOOK VERSION (FOR REACT COMPONENTS & HOOKS)
-------------------------------------------------------- */
export function useActorResolver() {
  const { identity, loading } = useIdentity()

  if (!identity || loading) {
    return {
      identity: null,
      loading,
      actorType: null,
      actorId: null,
      isUser: false,
      isVport: false
    }
  }

  return {
    identity,
    loading,

    actorType: isVportActor(identity) ? 'vport' : 'user',

    actorId: getActorId(identity),
    profileId: getProfileId(identity),
    vportId: getVportId(identity),

    username: getUsername(identity),
    displayName: getDisplayName(identity),
    avatar: getAvatar(identity),
    banner: getBanner(identity),

    isUser: isUserActor(identity),
    isVport: isVportActor(identity),
  }
}

/* --------------------------------------------------------
   STATIC VERSION (NON-REACT CODE: DAL, SERVICES, ETC.)
-------------------------------------------------------- */
export function resolveActorIdentity() {
  try {
    const identity = useIdentity.getState?.()?.identity
    if (!identity) {
      return { actorId: null, actorType: null }
    }

    return {
      actorType: identity.kind,
      actorId: identity.actorId,
      profileId: identity.profileId ?? null,
      vportId: identity.vportId ?? null
    }
  } catch (err) {
    console.error('[actorResolver] resolveActorIdentity error:', err)
    return {
      actorType: null,
      actorId: null,
      profileId: null,
      vportId: null
    }
  }
}

/* --------------------------------------------------------
   LEGACY COMPATIBILITY EXPORTS (required by 39 files)
-------------------------------------------------------- */

/* Old API compatibility: getCurrentActorId */
export function getCurrentActorId() {
  try {
    const identity = useIdentity.getState?.()?.identity
    return identity?.actorId ?? null
  } catch {
    return null
  }
}

/* Old API: getCurrentProfileId */
export function getCurrentProfileId() {
  try {
    const identity = useIdentity.getState?.()?.identity
    return identity?.profileId ?? null
  } catch {
    return null
  }
}

/* Old API: getCurrentVportId */
export function getCurrentVportId() {
  try {
    const identity = useIdentity.getState?.()?.identity
    return identity?.vportId ?? null
  } catch {
    return null
  }
}

/* Deprecated alias often used in older DAL files */
export function getActorIdentity() {
  return resolveActorIdentity()
}

/* Re-export boolean helpers for compatibility */
export { isUserActor, isVportActor }

/* --------------------------------------------------------
   END OF COMPAT WRAPPER
-------------------------------------------------------- */
