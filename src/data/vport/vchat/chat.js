// VPort-scoped chat data provider.
// Matches the interface your ChatScreen expects: getConversationHeader, listMessages, sendMessage, markConversationRead.

import { supabase } from '@/lib/supabaseClient';

// ===== DEBUG SWITCH ==========================================================
const __DBG = true; // set to false to silence debug logs
// ============================================================================

// --- helpers -----------------------------------------------------------------

async function getSessionUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const uid = data?.session?.user?.id ?? null;
  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.getSessionUserId]', { uid });
  }
  return uid;
}

/**
 * Extract vportId from conversations.pair_key.
 * Supports BOTH formats:
 *  - NEW (used by DAL):  "vpc:<vport_id>::<uidA>::<uidB>"
 *  - LEGACY (old client): "vpc:<vport_id>|u:<user_id>"
 */
function extractVportIdFromPairKey(pairKey) {
  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.extractVportIdFromPairKey] input', { pairKey });
  }
  if (!pairKey || typeof pairKey !== 'string' || !pairKey.startsWith('vpc:')) return null;

  // Legacy: "vpc:<vport_id>|u:<user_id>"
  if (pairKey.includes('|')) {
    const left = pairKey.split('|')[0]; // "vpc:<vport_id>"
    const vportId = left.split(':')[1] || null;
    if (__DBG) {
      // eslint-disable-next-line no-console
      console.debug('[vchat.extractVportIdFromPairKey] legacy format →', { vportId });
    }
    return vportId;
  }

  // New (DAL): "vpc:<vport_id>::<uidA>::<uidB>"
  const first = pairKey.split('::')[0]; // "vpc:<vport_id>"
  const vportId = first.split(':')[1] || null;
  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.extractVportIdFromPairKey] new format →', { vportId });
  }
  return vportId;
}

async function getPairKey(conversationId) {
  const { data, error } = await supabase
    .schema('vc')
    .from('conversations')
    .select('pair_key')
    .eq('id', conversationId)
    .maybeSingle();
  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.getPairKey]', { conversationId, pair_key: data?.pair_key, error });
  }
  if (error) throw error;
  return data?.pair_key ?? null;
}

/**
 * Match DAL contract:
 *   vc.actors(profile_id = vportId, kind = 'vport')
 */
// Matches your schema: vc.actors(kind='vport', vport_id=<vportId>)
async function getVportActorIdByVportId(vportId) {
  if (!vportId) return null;

  // primary path: vc.actors.vport_id
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('vport_id', vportId)
    .eq('kind', 'vport')
    .maybeSingle();

  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.getVportActorIdByVportId] via vc.actors(vport_id)', {
      vportId, actorId: data?.id, error
    });
  }

  if (error) throw error;
  if (data?.id) return data.id;

  // optional fallback if you have any legacy rows tied via profile_id
  try {
    const { data: legacy } = await supabase
      .schema('vc')
      .from('actors')
      .select('id')
      .eq('profile_id', vportId)   // legacy misuse
      .eq('kind', 'vport')
      .maybeSingle();
    if (__DBG) console.debug('[vchat.getVportActorIdByVportId] legacy fallback via profile_id', {
      vportId, actorId: legacy?.id
    });
    return legacy?.id ?? null;
  } catch {
    return null;
  }
}


async function getMyMembership(conversationId, ownerUserId) {
  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select('cleared_before, archived_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', ownerUserId)
    .maybeSingle();
  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.getMyMembership]', { conversationId, ownerUserId, data, error });
  }
  if (error) throw error;
  return data ?? null;
}

// --- public API --------------------------------------------------------------

// -> { id, cleared_before }
async function getConversationHeader(conversationId) {
  const ownerUserId = await getSessionUserId();
  if (!ownerUserId) throw new Error('Not authenticated');

  const member = await getMyMembership(conversationId, ownerUserId);
  const header = {
    id: conversationId,
    cleared_before: member?.cleared_before ?? null,
  };
  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.getConversationHeader] result', header);
  }
  return header;
}

// -> array of messages (ascending by created_at)
// Normalizes historical rows so that messages from the VPort actor render as "mine"
// when older rows have sender_user_id = null. New rows already set sender_user_id.
async function listMessages(conversationId, { limit = 500 } = {}) {
  const ownerUserId = await getSessionUserId();
  if (!ownerUserId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .select('id, conversation_id, actor_id, sender_user_id, sender_id, content, media_url, media_type, media_mime, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;

  // derive vport actor id for this conversation (from pair_key)
  const pairKey = await getPairKey(conversationId);
  const vportId = extractVportIdFromPairKey(pairKey);
  let vportActorId = null;
  if (vportId) {
    try { vportActorId = await getVportActorIdByVportId(vportId); } catch { /* noop */ }
  }

  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.listMessages] context', {
      conversationId,
      limit,
      totalFetched: data?.length ?? 0,
      pairKey,
      vportId,
      vportActorId,
    });
  }

  const normalized = (data || []).map((m) => {
    if (!m.sender_user_id && vportActorId && m.actor_id === vportActorId) {
      return { ...m, sender_user_id: ownerUserId };
    }
    return m;
  });

  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.listMessages] normalized sample', normalized?.slice(-3));
  }

  return normalized;
}

// Inserts as the VPort actor; stamps sender_user_id = owner user for correct unread/UI.
async function sendMessage(conversationId, payload) {
  const ownerUserId = await getSessionUserId();
  if (!ownerUserId) throw new Error('Not authenticated');

  const pairKey = await getPairKey(conversationId);
  const vportId = extractVportIdFromPairKey(pairKey);
  if (!vportId) {
    if (__DBG) {
      // eslint-disable-next-line no-console
      console.debug('[vchat.sendMessage] Not a VPort conversation', { conversationId, pairKey });
    }
    throw new Error('Not a VPort conversation');
  }

  const vportActorId = await getVportActorIdByVportId(vportId);
  if (!vportActorId) {
    if (__DBG) {
      // eslint-disable-next-line no-console
      console.debug('[vchat.sendMessage] VPort actor not found', { vportId });
    }
    throw new Error('VPort actor not found');
  }

  const insertPayload = {
    conversation_id: conversationId,
    actor_id: vportActorId,
    sender_user_id: ownerUserId, // ensures "mine" in UI and correct unread math
    sender_id: ownerUserId,
    content: payload?.content ?? null,
    media_url: payload?.media_url ?? null,
    media_type: payload?.media_type ?? (payload?.media_url ? 'file' : 'text'),
    media_mime: payload?.media_mime ?? null,
  };

  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.sendMessage] will insert', {
      conversationId,
      pairKey,
      vportId,
      vportActorId,
      ownerUserId,
      insertPayload,
    });
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .insert(insertPayload)
    .select()
    .maybeSingle();

  if (error) {
    if (__DBG) {
      // eslint-disable-next-line no-console
      console.debug('[vchat.sendMessage] insert error', error);
    }
    throw error;
  }

  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.sendMessage] inserted', data);
  }
  return data;
}

// Zero out unread for the current user in this conversation
async function markConversationRead(conversationId) {
  const ownerUserId = await getSessionUserId();
  if (!ownerUserId) return;

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({ unread_count: 0 })
    .eq('conversation_id', conversationId)
    .eq('user_id', ownerUserId);

  if (__DBG) {
    // eslint-disable-next-line no-console
    console.debug('[vchat.markConversationRead]', { conversationId, ownerUserId, error });
  }
}

export default {
  getConversationHeader,
  listMessages,
  sendMessage,
  markConversationRead,
};
