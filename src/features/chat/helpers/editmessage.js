// editmessage.js
// Edit a message body if (and only if) the caller is the sender_actor_id and the message isn't deleted.

import { createClient } from '@supabase/supabase-js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - initialized client
 * @param {Object} params
 * @param {string} params.messageId     - UUID of the message to edit
 * @param {string} params.actorId       - UUID of the caller's actor (must be sender)
 * @param {string} params.newBody       - New text body
 * @returns {Promise<{ ok: boolean, data?: any, error?: any }>}
 */
export async function editMessage(supabase, { messageId, actorId, newBody }) {
  if (!messageId || !actorId) {
    return { ok: false, error: 'messageId and actorId are required' };
  }
  if (typeof newBody !== 'string') {
    return { ok: false, error: 'newBody must be a string' };
  }

  const client = supabase.schema('vc');

  // 1) Verify ownership & current state
  const { data: msg, error: fetchErr } = await client
    .from('messages')
    .select('id, sender_actor_id, deleted_at, conversation_id')
    .eq('id', messageId)
    .single();

  if (fetchErr) return { ok: false, error: fetchErr };
  if (!msg) return { ok: false, error: 'Message not found' };
  if (msg.deleted_at) return { ok: false, error: 'Cannot edit a deleted message' };
  if (msg.sender_actor_id !== actorId) return { ok: false, error: 'Only the sender can edit this message' };

  // 2) Apply edit
  const { data: updated, error: updateErr } = await client
    .from('messages')
    .update({
      body: newBody,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select('id, body, edited_at')
    .single();

  if (updateErr) return { ok: false, error: updateErr };

  // 3) (Optional) If this was the conversation's last_message_id, keep the timestamp fresh
  //    This is safe and idempotent; if you have DB triggers, this becomes a no-op.
  await _touchConversationLastMessage(client, msg.conversation_id).catch(() => { /* non-fatal */ });

  return { ok: true, data: updated };
}

/**
 * Set conversations.last_message_at to the current time if the provided last message still matches.
 * Also light-touch refresh of inbox_entries.last_message_at for all members.
 */
async function _touchConversationLastMessage(client, conversationId) {
  if (!conversationId) return;

  // Read current last_message_id
  const { data: convo, error: convoErr } = await client
    .from('conversations')
    .select('id, last_message_id')
    .eq('id', conversationId)
    .single();
  if (convoErr || !convo?.last_message_id) return;

  const nowIso = new Date().toISOString();

  await client
    .from('conversations')
    .update({ last_message_at: nowIso })
    .eq('id', conversationId);

  // Update inbox rows to keep list ordering consistent
  await client
    .from('inbox_entries')
    .update({ last_message_at: nowIso, last_message_id: convo.last_message_id })
    .eq('conversation_id', conversationId);
}

// Optional factory
export function makeSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
