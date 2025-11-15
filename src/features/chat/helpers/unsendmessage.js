// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\chat\helpers\unsendmessage.js
// VERSION: 2025-11-11 (DB-driven pointers; no client recompute)

import { createClient } from '@supabase/supabase-js';

/**
 * "Unsend" = soft-delete for everyone: set vc.messages.deleted_at.
 * Only the original sender (or a privileged actor via RLS) can unsend.
 * Pointers are recomputed by the DB trigger trg_messages_after_update_deleted.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ messageId: string, actorId: string }} params
 */
export async function unsendMessage(supabase, { messageId, actorId }) {
  if (!messageId || !actorId) return { ok: false, error: 'messageId and actorId are required' };

  const client = supabase.schema('vc');

  // 1) Validate ownership + fetch convo id
  const { data: msg, error: fetchErr } = await client
    .from('messages')
    .select('id, sender_actor_id, conversation_id, deleted_at')
    .eq('id', messageId)
    .single();

  if (fetchErr) return { ok: false, error: fetchErr };
  if (!msg)      return { ok: false, error: 'Message not found' };
  if (msg.deleted_at) return { ok: true, data: { alreadyUnsent: true } };
  if (msg.sender_actor_id !== actorId) return { ok: false, error: 'Only the sender can unsend this message' };

  // 2) Soft-delete (DB trigger will fix pointers for conversations + inbox_entries)
  const nowIso = new Date().toISOString();
  const { data: deleted, error: delErr } = await client
    .from('messages')
    .update({ deleted_at: nowIso, body: null })
    .eq('id', messageId)
    .select('id, conversation_id, deleted_at')
    .single();

  if (delErr) return { ok: false, error: delErr };
  return { ok: true, data: deleted };
}

// Optional factory (unchanged)
export function makeSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
