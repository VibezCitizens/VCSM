// src/state/actors/assertActorId.js
import { isUuid } from '@/services/supabase/postgrestSafe'

export function assertActorId(actor, label = 'actor') {
  if (!actor || typeof actor !== 'string' || !actor.trim() || !isUuid(actor)) {
    throw new Error(`${label} must be a valid UUID string`)
  }
}
