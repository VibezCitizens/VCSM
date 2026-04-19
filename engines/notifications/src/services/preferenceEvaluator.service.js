// ============================================================
// Notifications Engine — Preference Evaluator Service
// ============================================================
// Determines whether a recipient should receive a notification
// through a given channel, respecting mute, frequency, and quiet hours.

import { dalGetPreference, dalListPreferencesByActor } from '../dal/preferences.read.dal.js'

/**
 * Evaluate whether a channel is enabled for a recipient + event.
 *
 * Preference lookup cascade:
 *   1. Specific preference: actorId + eventKey + channel
 *   2. General channel pref: actorId + channel (eventKey = null)
 *   3. Default: enabled (no preference = allow)
 *
 * @param {Object} params
 * @param {string} params.recipientActorId
 * @param {string} params.eventKey
 * @param {string} params.channel
 * @param {Object} [params.trace]
 * @returns {Promise<{ allowed: boolean, reason: string, frequency: string }>}
 */
export async function evaluatePreference({ recipientActorId, eventKey, channel, trace = null }) {
  trace?.report?.({ step: 'PREF_EVAL_START', status: 'start', eventKey, channel })

  // 1. Specific preference for this event + channel
  const specific = await dalGetPreference({ ownerActorId: recipientActorId, eventKey, channel, trace })

  if (specific) {
    return evaluateRule(specific, trace)
  }

  // 2. General channel preference (no specific event)
  const general = await dalGetPreference({ ownerActorId: recipientActorId, eventKey: null, channel, trace })

  if (general) {
    return evaluateRule(general, trace)
  }

  // 3. No preference found — default allow
  trace?.report?.({ step: 'PREF_EVAL_DEFAULT', status: 'success', result: 'allowed' })
  return { allowed: true, reason: 'no_preference_default_allow', frequency: 'immediate' }
}

/**
 * @param {Object} pref — raw preference row
 * @param {Object} [trace]
 * @returns {{ allowed: boolean, reason: string, frequency: string }}
 */
function evaluateRule(pref, trace) {
  // Disabled entirely
  if (!pref.is_enabled) {
    trace?.report?.({ step: 'PREF_EVAL_DISABLED', status: 'success', prefId: pref.id })
    return { allowed: false, reason: 'disabled', frequency: pref.frequency }
  }

  // Frequency = disabled
  if (pref.frequency === 'disabled') {
    trace?.report?.({ step: 'PREF_EVAL_FREQ_DISABLED', status: 'success', prefId: pref.id })
    return { allowed: false, reason: 'frequency_disabled', frequency: 'disabled' }
  }

  // Muted until a future time
  if (pref.mute_until) {
    const muteEnd = new Date(pref.mute_until)
    if (muteEnd > new Date()) {
      trace?.report?.({ step: 'PREF_EVAL_MUTED', status: 'success', muteUntil: pref.mute_until })
      return { allowed: false, reason: 'muted', frequency: pref.frequency }
    }
  }

  // Quiet hours check
  if (pref.quiet_hours && typeof pref.quiet_hours === 'object' && pref.quiet_hours.start && pref.quiet_hours.end) {
    if (isInQuietHours(pref.quiet_hours)) {
      trace?.report?.({ step: 'PREF_EVAL_QUIET_HOURS', status: 'success' })
      return { allowed: false, reason: 'quiet_hours', frequency: pref.frequency }
    }
  }

  trace?.report?.({ step: 'PREF_EVAL_ALLOWED', status: 'success', frequency: pref.frequency })
  return { allowed: true, reason: 'allowed', frequency: pref.frequency }
}

/**
 * Check if current time falls within quiet hours.
 * Expects { start: "HH:MM", end: "HH:MM", timezone?: string }.
 */
function isInQuietHours(qh) {
  try {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const current = hours * 60 + minutes

    const [startH, startM] = qh.start.split(':').map(Number)
    const [endH, endM] = qh.end.split(':').map(Number)
    const start = startH * 60 + startM
    const end = endH * 60 + endM

    if (start <= end) {
      return current >= start && current < end
    }
    // Overnight: e.g., 22:00 - 07:00
    return current >= start || current < end
  } catch (_) {
    return false
  }
}
