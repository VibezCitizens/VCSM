// VERSION: 2025-11-10 — debug logs + exports `deleteForMe` alias

/**
 * Hides a message for the current actor by setting vc.message_receipts.hidden_at.
 * This is a SOFT delete (local hide), not a hard delete.
 *
 * All functions expect a Supabase v2 client to be passed in.
 */

function dlog(...args) {
  // single place to toggle helper logs
  const DEBUG = true;
  if (DEBUG) {
    const ts = new Date().toISOString();
    console.debug('[deleteforme]', ts, ...args);
  }
}

// -------- internal: resolve current actor_id from the signed-in user --------
async function resolveActorId(supabase) {
  dlog('resolveActorId:start');
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userResp?.user?.id;
  if (!userId) throw new Error('Not signed in');

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('actor_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;

  const actorId = data?.[0]?.actor_id || null;
  if (!actorId) throw new Error('No actor found for current user');

  dlog('resolveActorId:ok', { userId, actorId });
  return actorId;
}

// -------- internal upsert helpers --------
async function upsertHiddenReceipt(supabase, { actorId, messageId, hiddenAt }) {
  dlog('upsertHiddenReceipt:start', { actorId, messageId, hiddenAt });
  const payload = {
    message_id: messageId,
    actor_id: actorId,
    hidden_at: hiddenAt ?? new Date().toISOString(),
  };

  const t0 = performance.now();
  const { data, error } = await supabase
    .schema('vc')
    .from('message_receipts')
    .upsert(payload, { onConflict: 'message_id,actor_id' })
    .select()
    .single();
  const t1 = performance.now();

  if (error) {
    dlog('upsertHiddenReceipt:error', { messageId, error });
    throw error;
  }
  dlog('upsertHiddenReceipt:ok', { ms: Math.round(t1 - t0), receiptId: data?.message_id });
  return data;
}

async function upsertHiddenReceiptsBatch(supabase, { actorId, messageIds, hiddenAt }) {
  dlog('upsertHiddenReceiptsBatch:start', { actorId, count: messageIds?.length ?? 0 });
  if (!Array.isArray(messageIds) || messageIds.length === 0) return [];
  const now = hiddenAt ?? new Date().toISOString();
  const rows = messageIds.map((id) => ({
    message_id: id,
    actor_id: actorId,
    hidden_at: now,
  }));
  const t0 = performance.now();
  const { data, error } = await supabase
    .schema('vc')
    .from('message_receipts')
    .upsert(rows, { onConflict: 'message_id,actor_id' })
    .select();
  const t1 = performance.now();
  if (error) {
    dlog('upsertHiddenReceiptsBatch:error', error);
    throw error;
  }
  dlog('upsertHiddenReceiptsBatch:ok', { ms: Math.round(t1 - t0), wrote: data?.length ?? 0 });
  return data || [];
}

// -------- public API --------

/**
 * Explicit API: hide a message for a specific actor.
 */
export async function deleteMessageForMe(supabase, { actorId, messageId, hiddenAt } = {}) {
  if (!supabase) throw new Error('supabase client required');
  if (!messageId) throw new Error('messageId required');
  dlog('deleteMessageForMe:call', { actorIdHint: !!actorId, messageId });

  const resolvedActorId = actorId || (await resolveActorId(supabase));
  const receipt = await upsertHiddenReceipt(supabase, {
    actorId: resolvedActorId,
    messageId,
    hiddenAt,
  });
  dlog('deleteMessageForMe:done', { messageId, actorId: resolvedActorId });
  return { ok: true, receipt };
}

/**
 * Convenience alias to match existing imports:
 *    await deleteForMe(supabase, messageId)
 * Uses the current signed-in user's primary actor automatically.
 */
export async function deleteForMe(supabase, messageId) {
  dlog('deleteForMe(alias):call', { messageId });
  return deleteMessageForMe(supabase, { messageId });
}

/**
 * Batch hide.
 */
export async function deleteMessagesForMeBatch(supabase, { actorId, messageIds, hiddenAt } = {}) {
  if (!supabase) throw new Error('supabase client required');
  const resolvedActorId = actorId || (await resolveActorId(supabase));
  const receipts = await upsertHiddenReceiptsBatch(supabase, {
    actorId: resolvedActorId,
    messageIds,
    hiddenAt,
  });
  dlog('deleteMessagesForMeBatch:done', { count: receipts.length });
  return { ok: true, receipts };
}

/**
 * Undo hide for one message.
 */
export async function undoDeleteForMe(supabase, { actorId, messageId } = {}) {
  if (!supabase) throw new Error('supabase client required');
  const resolvedActorId = actorId || (await resolveActorId(supabase));
  dlog('undoDeleteForMe:call', { messageId, actorId: resolvedActorId });

  const t0 = performance.now();
  const { data, error } = await supabase
    .schema('vc')
    .from('message_receipts')
    .update({ hidden_at: null })
    .eq('message_id', messageId)
    .eq('actor_id', resolvedActorId)
    .select()
    .maybeSingle();
  const t1 = performance.now();

  if (error) {
    dlog('undoDeleteForMe:error', error);
    throw error;
  }
  dlog('undoDeleteForMe:ok', { ms: Math.round(t1 - t0), messageId });
  return { ok: true, receipt: data ?? null };
}

/**
 * Utility: get hidden message IDs for this actor (optionally within a subset).
 */
export async function getHiddenMessageIdSet(supabase, { actorId, messageIds } = {}) {
  if (!supabase) throw new Error('supabase client required');
  const resolvedActorId = actorId || (await resolveActorId(supabase));

  dlog('getHiddenMessageIdSet:call', {
    actorId: resolvedActorId,
    scoped: Array.isArray(messageIds) && messageIds.length > 0 ? messageIds.length : 'ALL',
  });

  let base = supabase
    .schema('vc')
    .from('message_receipts')
    .select('message_id')
    .eq('actor_id', resolvedActorId)
    .not('hidden_at', 'is', null);

  if (Array.isArray(messageIds) && messageIds.length > 0) {
    const CHUNK = 1000;
    const set = new Set();
    for (let i = 0; i < messageIds.length; i += CHUNK) {
      const part = messageIds.slice(i, i + CHUNK);
      const { data, error } = await base.in('message_id', part);
      if (error) throw error;
      (data || []).forEach((r) => set.add(r.message_id));
    }
    dlog('getHiddenMessageIdSet:done(scoped)', { count: set.size });
    return set;
  }

  const { data, error } = await base;
  if (error) throw error;
  const out = new Set((data || []).map((r) => r.message_id));
  dlog('getHiddenMessageIdSet:done', { count: out.size });
  return out;
}

// Local helpers for array filtering (pure)
export function filterOutHiddenMessages(messages, hiddenIdSet) {
  return Array.isArray(messages) && hiddenIdSet
    ? messages.filter((m) => !hiddenIdSet.has(m.id))
    : messages;
}

export function isMessageVisibleForActor(message, hiddenIdSet) {
  return !!message && !hiddenIdSet?.has(message.id);
}
