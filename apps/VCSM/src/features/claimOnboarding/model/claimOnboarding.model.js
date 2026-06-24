// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — claim-onboarding model (pure logic).
// First-run acknowledgment (per VPORT, client-side) + activation checklist.

const ACK_PREFIX = 'vcsm:claim-welcome-ack:'

// First-run is tracked per connected VPORT actor in localStorage. This is UX
// state only (which welcome cards the owner has dismissed) — never identity.
export function isClaimWelcomeAcknowledged(vportActorId) {
  if (!vportActorId || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(ACK_PREFIX + vportActorId) === '1'
  } catch {
    return false
  }
}

export function acknowledgeClaimWelcome(vportActorId) {
  if (!vportActorId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ACK_PREFIX + vportActorId, '1')
  } catch {
    /* private mode — best effort */
  }
}

// Activation checklist computed from the connected VPORT profile.
// Categories are guaranteed at creation (T4 requires a primary category, or the
// linked VPORT already has one), so they are not re-checked here.
export function computeActivationChecklist(profile) {
  const p = profile ?? {}
  return [
    { key: 'logo',        label: 'Add a logo',            done: Boolean(p.avatar_url) },
    { key: 'banner',      label: 'Add a banner',          done: Boolean(p.banner_url) },
    { key: 'description', label: 'Write a description',    done: Boolean(p.bio && String(p.bio).trim()) },
    { key: 'directory',   label: 'List in the directory', done: Boolean(p.directory_visible) },
  ]
}

export function checklistCompletion(items) {
  const list = Array.isArray(items) ? items : []
  const done = list.filter((i) => i.done).length
  return { done, total: list.length, complete: list.length > 0 && done === list.length }
}
