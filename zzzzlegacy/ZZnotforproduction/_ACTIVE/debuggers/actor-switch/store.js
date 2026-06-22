// debuggers/actor-switch/store.js
// ============================================================
// Actor Switch Debug Store
// DEV-ONLY. Tracks the full switch pipeline per attempt.
// Persists to sessionStorage so panel survives navigation.
// ============================================================

import { onDebugUserChange, registerDebugCollector } from '../cycle.js'

const STORAGE_KEY = 'vcsm.debug.switch.attempts'
const MAX_ATTEMPTS = 20
const MAX_EVENTS_PER_ATTEMPT = 60

let _attempts = []       // [{ id, events[], snapshot, startedAt }]
let _listeners = new Set()
let _hydrated = false

// Clear switch attempts when auth user changes
onDebugUserChange(() => {
  _attempts = []
  try { sessionStorage.removeItem(STORAGE_KEY) } catch (_) {}
  notify()
})

registerDebugCollector('switch', () => ({
  attemptCount: _attempts.length,
  lastVerdict: _attempts[0]?.verdict ?? null,
}))

// ---- Persistence ----

function hydrate() {
  if (_hydrated) return
  _hydrated = true
  if (!import.meta.env.DEV) return
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) _attempts = parsed
    }
  } catch (_) {}
}

function persist() {
  if (!import.meta.env.DEV) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(_attempts))
  } catch (_) {}
}

function notify() {
  for (const fn of _listeners) {
    try { fn() } catch (_) {}
  }
}

// ---- Enable check ----

export function isSwitchDebugEnabled() {
  if (!import.meta.env.DEV) return false
  return true
}

// ---- Attempt lifecycle ----

let _counter = 0

export function startSwitchAttempt({ entryPoint, requestedActorId, previousActorId }) {
  if (!import.meta.env.DEV) return null
  hydrate()

  _counter++
  const id = `sw-${Date.now()}-${_counter}`
  const attempt = {
    id,
    entryPoint: entryPoint ?? 'unknown',
    requestedActorId: requestedActorId ?? null,
    previousActorId: previousActorId ?? null,
    startedAt: new Date().toISOString(),
    events: [],
    snapshot: null,
    verdict: null,
  }

  _attempts = [attempt, ..._attempts].slice(0, MAX_ATTEMPTS)
  persist()
  notify()
  return id
}

export function addSwitchEvent(attemptId, { step, status = 'info', message = '', payload = null, error = null }) {
  if (!import.meta.env.DEV) return
  hydrate()

  const attempt = _attempts.find((a) => a.id === attemptId)
  if (!attempt) return

  attempt.events.push({
    at: new Date().toISOString(),
    t: performance.now(),
    step,
    status,
    message,
    payload,
    error: error ? { code: error?.code, message: error?.message ?? String(error) } : null,
  })

  if (attempt.events.length > MAX_EVENTS_PER_ATTEMPT) {
    attempt.events = attempt.events.slice(-MAX_EVENTS_PER_ATTEMPT)
  }

  persist()
  notify()
}

export function finishSwitchAttempt(attemptId, { snapshot, verdict }) {
  if (!import.meta.env.DEV) return
  hydrate()

  const attempt = _attempts.find((a) => a.id === attemptId)
  if (!attempt) return

  attempt.snapshot = snapshot ?? null
  attempt.verdict = verdict ?? computeVerdict(snapshot)
  persist()
  notify()
}

// ---- Verdict computation ----

export function computeVerdict(snap) {
  if (!snap) return 'unknown'

  const {
    engineContextResolved,
    linkMatched,
    platformWriteSucceeded,
    hydrationSucceeded,
    stateUpdated,
    refreshRestoredSameActor,
  } = snap

  if (!engineContextResolved || !linkMatched) return 'failed_before_hydration'

  if (platformWriteSucceeded && !hydrationSucceeded) return 'failed_after_platform_write'
  if (platformWriteSucceeded && hydrationSucceeded && !stateUpdated) return 'failed_after_platform_write'

  if (hydrationSucceeded && stateUpdated && (!platformWriteSucceeded || refreshRestoredSameActor === false)) {
    return 'optimistic_only'
  }

  if (
    engineContextResolved &&
    linkMatched &&
    platformWriteSucceeded &&
    hydrationSucceeded &&
    stateUpdated
  ) {
    // refreshRestoredSameActor may not be checked yet (requires page reload)
    if (refreshRestoredSameActor === true) return 'fully_successful'
    if (refreshRestoredSameActor === null || refreshRestoredSameActor === undefined) return 'fully_successful'
    return 'optimistic_only'
  }

  return 'unknown'
}

// ---- Refresh restore tracking ----

const LAST_SWITCH_KEY = 'vcsm.debug.switch.lastRequestedActorId'

export function persistLastSwitchTarget(actorId) {
  if (!import.meta.env.DEV) return
  try { sessionStorage.setItem(LAST_SWITCH_KEY, actorId) } catch (_) {}
}

export function checkRefreshRestore(currentActorId) {
  if (!import.meta.env.DEV) return null
  try {
    const last = sessionStorage.getItem(LAST_SWITCH_KEY)
    if (!last) return null
    return last === currentActorId
  } catch (_) { return null }
}

export function clearLastSwitchTarget() {
  if (!import.meta.env.DEV) return
  try { sessionStorage.removeItem(LAST_SWITCH_KEY) } catch (_) {}
}

// ---- Vport switcher resolution log ----
// Records pre-switch resolution decisions from useVportSwitcher,
// BEFORE switchActor is called. This is the layer where wrong-actor
// selection happens when profile actor_id is stale.

const MAX_RESOLUTIONS = 20
let _resolutions = []

export function recordVportResolution({
  clickedId,        // v.actor_id from the profile row
  profileName,      // v.name
  resolvedId,       // actorId that will be passed to switchActor (or null if aborted)
  fallback,         // 'exact' | 'name' | 'single-link' | null
  aborted,          // true if no resolution found → switch will not proceed
  availableVportIds, // all vport-kind actorIds from availableActors
}) {
  if (!import.meta.env.DEV) return
  _resolutions = [
    {
      at: new Date().toISOString(),
      clickedId: clickedId ?? null,
      profileName: profileName ?? null,
      resolvedId: resolvedId ?? null,
      fallback: fallback ?? null,
      aborted: aborted ?? false,
      availableVportIds: availableVportIds ?? [],
    },
    ..._resolutions,
  ].slice(0, MAX_RESOLUTIONS)
  notify()
}

export function getVportResolutions() {
  return _resolutions
}

// ---- Read / subscribe ----

export function getSwitchDebugState() {
  hydrate()
  return { attempts: _attempts, resolutions: _resolutions }
}

export function clearSwitchDebugState() {
  _attempts = []
  try { sessionStorage.removeItem(STORAGE_KEY) } catch (_) {}
  notify()
}

export function subscribeSwitchDebug(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
