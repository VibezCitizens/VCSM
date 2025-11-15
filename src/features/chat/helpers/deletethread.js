// deletethread.js
// VERSION: 2025-11-11.1 (adds detailed debug timing/prints; no DB changes)
// One-sided thread delete:
// - Sets vc.inbox_entries.history_cutoff_at = now() for (conversation_id, actor_id)
// - Clears pointers (last_message_id/at), zeroes unread_count
// - Optionally sets archived_until_new=true or archived=true
//
// Assumes RLS allows the current user to UPDATE their own inbox_entries row.

import { isAbortError } from '@/features/chat/utils/isAbortError'

const DEBUG_DELETE = true
const dbg = (...args) => { if (DEBUG_DELETE) console.log('[deleteThreadForMe]', ...args) }

/**
 * Delete a thread for the current actor only (does NOT affect the other participant).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - initialized client
 * @param {Object} params
 * @param {string} params.conversationId - UUID
 * @param {string} params.actorId - UUID of the caller's actor
 * @param {Object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @param {boolean} [opts.archiveUntilNew=true] - if true, set archived_until_new=true
 * @param {boolean} [opts.archive=false] - if true, set archived=true instead
 * @returns {Promise<{ ok: boolean, data?: any, error?: any }>}
 */
export async function deleteThreadForMe(
  supabase,
  { conversationId, actorId },
  opts = {}
) {
  const { signal, archiveUntilNew = true, archive = false } = opts
  if (!conversationId || !actorId) {
    return { ok: false, error: 'conversationId and actorId are required' }
  }

  // Ensure we have an auth session before mutating
  try {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) return { ok: false, error: 'Not authenticated' }
  } catch (e) {
    return { ok: false, error: e }
  }

  const client = supabase.schema('vc')

  const nowIso = new Date().toISOString()
  const patch = {
    history_cutoff_at: nowIso,
    last_message_id: null,
    last_message_at: null,
    unread_count: 0,
  }
  if (archive) {
    patch.archived = true
    patch.archived_until_new = false
  } else if (archiveUntilNew) {
    patch.archived_until_new = true
  }

  try {
    // Abortable support (Supabase JS v2 supports .abortSignal on queries)
    if (DEBUG_DELETE) {
      console.groupCollapsed('[deleteThreadForMe] start')
      dbg('params:', { conversationId, actorId })
      dbg('patch:', patch)
      console.time('[deleteThreadForMe] update')
    }

    const q = client
      .from('inbox_entries')
      .update(patch)
      .eq('conversation_id', conversationId)
      .eq('actor_id', actorId)
      .select('conversation_id, actor_id, history_cutoff_at, archived, archived_until_new, unread_count, last_message_id, last_message_at')
      .single()

    if (signal && typeof q.abortSignal === 'function') q.abortSignal(signal)

    const { data: row, error } = await q

    if (DEBUG_DELETE) {
      console.timeEnd('[deleteThreadForMe] update')
      if (error) {
        console.error('[deleteThreadForMe] supabase error:', error)
        console.groupEnd()
      } else {
        console.table(row)
        console.groupEnd()
      }
    }

    if (error) return { ok: false, error }
    return { ok: true, data: row }
  } catch (e) {
    if (isAbortError(e)) return { ok: false, error: e }
    return { ok: false, error: e?.message || e }
  }
}

/**
 * OPTIONAL: Clear cutoff (un-archive) manually for a user, if needed.
 * Normally not required because a *new incoming* message will auto-pop the thread
 * when your message-insert trigger respects history_cutoff_at.
 */
export async function clearThreadCutoff(
  supabase,
  { conversationId, actorId },
  opts = {}
) {
  const { signal } = opts
  if (!conversationId || !actorId) {
    return { ok: false, error: 'conversationId and actorId are required' }
  }
  const client = supabase.schema('vc')
  try {
    if (DEBUG_DELETE) {
      console.groupCollapsed('[clearThreadCutoff] start')
      console.time('[clearThreadCutoff] update')
      dbg('params:', { conversationId, actorId })
    }

    const q = client
      .from('inbox_entries')
      .update({ history_cutoff_at: null, archived_until_new: false, archived: false })
      .eq('conversation_id', conversationId)
      .eq('actor_id', actorId)
      .select('conversation_id, actor_id, history_cutoff_at, archived, archived_until_new')
      .single()

    if (signal && typeof q.abortSignal === 'function') q.abortSignal(signal)

    const { data, error } = await q

    if (DEBUG_DELETE) {
      console.timeEnd('[clearThreadCutoff] update')
      if (error) {
        console.error('[clearThreadCutoff] supabase error:', error)
      } else {
        console.table(data)
      }
      console.groupEnd()
    }

    if (error) return { ok: false, error }
    return { ok: true, data }
  } catch (e) {
    if (isAbortError(e)) return { ok: false, error: e }
    return { ok: false, error: e?.message || e }
  }
}
