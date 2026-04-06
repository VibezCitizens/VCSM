// debuggers/actor-switch/helpers.js
// ============================================================
// Actor Switch Debug Helpers
// DEV-ONLY. Provides a clean API for instrumenting switchActor.
// ============================================================

import {
  startSwitchAttempt,
  addSwitchEvent,
  finishSwitchAttempt,
  persistLastSwitchTarget,
  computeVerdict,
} from './store.js'

/**
 * Create a switch debug session. Returns an object with methods
 * scoped to a single switch attempt.
 *
 * Usage:
 *   const dbg = createSwitchDebugSession({ entryPoint, requestedActorId, previousActorId })
 *   dbg.event('SWITCH_START', { status: 'info' })
 *   dbg.finish(snapshot)
 */
export function createSwitchDebugSession({ entryPoint, requestedActorId, previousActorId }) {
  if (!import.meta.env.DEV) {
    return {
      id: null,
      event: () => {},
      error: () => {},
      finish: () => {},
    }
  }

  const id = startSwitchAttempt({ entryPoint, requestedActorId, previousActorId })

  persistLastSwitchTarget(requestedActorId)

  return {
    id,

    event(step, opts = {}) {
      addSwitchEvent(id, { step, ...opts })
    },

    error(step, err, opts = {}) {
      addSwitchEvent(id, {
        step,
        status: 'error',
        message: opts.message || err?.message,
        error: err,
        ...opts,
      })
    },

    finish(snapshot) {
      const verdict = computeVerdict(snapshot)
      finishSwitchAttempt(id, { snapshot, verdict })
    },
  }
}
