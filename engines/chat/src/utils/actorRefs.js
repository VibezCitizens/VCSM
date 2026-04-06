import { getDefaultActorSource } from '../config.js'

export function normalizeActorSource(actorSource = null) {
  const source = actorSource ?? getDefaultActorSource()
  if (source === 'learning' || source === 'vc') return source
  return null
}

export function normalizeActorRef({ actorId, actorSource = null } = {}) {
  if (!actorId) {
    throw new Error('[actorRefs] actorId required')
  }

  return {
    actorId,
    actorSource: normalizeActorSource(actorSource),
  }
}

export function getActorRefKey({ actorId, actorSource = null } = {}) {
  const ref = normalizeActorRef({ actorId, actorSource })
  return `${ref.actorSource ?? 'unknown'}:${ref.actorId}`
}

export function sameActorRef(left, right) {
  if (!left?.actorId || !right?.actorId) return false

  return getActorRefKey(left) === getActorRefKey(right)
}
