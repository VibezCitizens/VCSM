// src/data/chat.js
/**
 * Chat DAL (Data Access Layer)
 * All reads/writes for conversations & messages live here.
 * Supports: user↔user DMs (conversations/messages) and vport DMs (vport_conversations/vport_messages)
 */
import { supabase } from '@/lib/supabaseClient';

/* ------------------------------- helpers ------------------------------- */

async function requireAuthUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data?.user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}
const nowIso = () => new Date().toISOString();

/* ============================== USER DMs =============================== */

/**
 * Get or create a direct 1:1 conversation between the current user and another user.
 * Uses SECURITY DEFINER RPC: public.get_or_create_private_conversation(user_id_1 uuid, user_id_2 uuid)
 */
export async function getOrCreateDirect(otherUserId) {
  const me = await requireAuthUserId();
  if (!otherUserId || otherUserId === me) throw new Error('Invalid otherUserId');

  const { data, error } = await supabase.rpc(
    'get_or_create_private_conversation',
    { user_id_1: me, user_id_2: otherUserId }
  );
  if (error) throw error;

  const conversationId = typeof data === 'string' ? data : data?.id;
  if (!conversationId) throw new Error('RPC did not return conversation id');

  return { id: conversationId };
}

/**
 * Ensure the direct conversation exists and is *visible* for me.
 * - Creates the convo if needed (via getOrCreateDirect / RPC)
 * - Unarchives *my* membership, stamps partner_user_id
 * - Optionally restores history (cleared_before = null) when { restoreHistory: true }
 * Returns: { id, members: Array<{ user_id }> }
 */
export async function getOrCreateDirectVisible(otherUserId, { restoreHistory = false } = {}) {
  const me = await requireAuthUserId();
  if (!otherUserId || otherUserId === me) throw new Error('Invalid otherUserId');

  const { id: conversationId } = await getOrCreateDirect(otherUserId);

  // Unarchive + stamp partner pointer (+ optionally restore history)
  const patch = {
    archived_at: null,
    partner_user_id: otherUserId,
    ...(restoreHistory ? { cleared_before: null } : {}),
  };
  const upd = await supabase
    .from('conversation_members')
    .update(patch)
    .eq('conversation_id', conversationId)
    .eq('user_id', me);
  if (upd.error) throw upd.error;

  // Best-effort include member ids
  let members = [];
  const mems = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId);
  if (!mems.error && mems.data) members = mems.data;

  return { id: conversationId, members };
}

/** List my 1:1 conversations (newest first), with partner profile + last message preview. */
export async function listConversations({ limit = 50, offset = 0 } = {}) {
  const me = await requireAuthUserId();

  // 1) pull conversation rows + my membership flags, INCLUDING partner_user_id (no relationship shorthand)
  const res = await supabase
    .from('conversation_members')
    .select(`
      conversation_id,
      partner_user_id,
      muted, archived_at, cleared_before,
      conversation:conversation_id (
        id, updated_at, last_message_at, last_message_preview, last_message_sender
      )
    `)
    .eq('user_id', me)
    .order('conversation.updated_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (res.error) throw res.error;

  const rows = res.data || [];
  const partnerIds = [...new Set(rows.map(r => r.partner_user_id).filter(Boolean))];

  // 2) fetch partner profiles in one shot
  let partnersById = {};
  if (partnerIds.length) {
    const p = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url')
      .in('id', partnerIds);
    if (p.error) throw p.error;
    partnersById = (p.data || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
  }

  // 3) compose result
  return rows.map((row) => ({
    id: row.conversation?.id,
    partner: row.partner_user_id ? partnersById[row.partner_user_id] || null : null,
    muted: row.muted,
    archived_at: row.archived_at,
    cleared_before: row.cleared_before,
    last_message_at: row.conversation?.last_message_at,
    last_message_preview: row.conversation?.last_message_preview,
    last_message_sender: row.conversation?.last_message_sender,
    updated_at: row.conversation?.updated_at,
  }));
}

/** Fetch a single DM header for the current user (partner profile + my member flags). */
export async function getConversationHeader(conversationId) {
  const me = await requireAuthUserId();

  // 1) fetch my membership row incl partner_user_id (no relationship shorthand)
  const res = await supabase
    .from('conversation_members')
    .select(`
      partner_user_id, muted, archived_at, cleared_before,
      conversation:conversation_id (
        id, updated_at, last_message_at, last_message_preview, last_message_sender
      )
    `)
    .eq('user_id', me)
    .eq('conversation_id', conversationId)
    .maybeSingle();
  if (res.error) throw res.error;
  if (!res.data) throw new Error('Conversation not found');

  // 2) fetch partner profile if present
  let partner = null;
  if (res.data.partner_user_id) {
    const p = await supabase
      .from('profiles')
      .select('id, display_name, username, photo_url')
      .eq('id', res.data.partner_user_id)
      .maybeSingle();
    if (p.error) throw p.error;
    partner = p.data ?? null;
  }

  return {
    id: res.data.conversation?.id,
    partner,
    muted: res.data.muted,
    archived_at: res.data.archived_at,
    cleared_before: res.data.cleared_before,
    last_message_at: res.data.conversation?.last_message_at,
    last_message_preview: res.data.conversation?.last_message_preview,
    last_message_sender: res.data.conversation?.last_message_sender,
    updated_at: res.data.conversation?.updated_at,
  };
}

/** Fetch messages in a conversation (oldest first). Supports "before" cursor for paging up. */
export async function listMessages(conversationId, { limit = 50, before = null } = {}) {
  await requireAuthUserId();
  let q = supabase
    .from('messages')
    .select(
      `
      id, conversation_id, sender_id, content, media_url, media_type, created_at,
      sender:sender_id ( id, display_name, username, photo_url )
    `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (before) q = q.lt('created_at', before);

  const res = await q;
  if (res.error) throw res.error;
  return res.data || [];
}

/** Send a text/media message to a conversation and update conversation metadata. */
export async function sendMessage(conversationId, { content = '', media_url = null, media_type = null } = {}) {
  const me = await requireAuthUserId();
  if (!conversationId) throw new Error('conversationId required');
  if (!content && !media_url) throw new Error('Message must have content or media');

  const ins = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: me,
      content: content || null,
      media_url: media_url || null,
      media_type: media_type || null,
    })
    .select('id, created_at')
    .single();
  if (ins.error) throw ins.error;

  // best-effort update of conversation last message fields
  const preview = content ? content.slice(0, 140) : media_type ? `[${media_type}]` : '';
  const upd = await supabase
    .from('conversations')
    .update({
      updated_at: nowIso(),
      last_message_at: ins.data.created_at,
      last_message_preview: preview,
      last_message_sender: me,
    })
    .eq('id', conversationId);
  if (upd.error) throw upd.error;

  return ins.data;
}

/** Mute/unmute a conversation for the current user. */
export async function setMuted(conversationId, muted = true) {
  const me = await requireAuthUserId();
  const res = await supabase
    .from('conversation_members')
    .update({ muted })
    .eq('conversation_id', conversationId)
    .eq('user_id', me);
  if (res.error) throw res.error;
  return true;
}

/** Archive or unarchive a conversation for the current user. */
export async function setArchived(conversationId, archive = true) {
  const me = await requireAuthUserId();
  const patch = archive ? { archived_at: nowIso() } : { archived_at: null };
  const res = await supabase
    .from('conversation_members')
    .update(patch)
    .eq('conversation_id', conversationId)
    .eq('user_id', me);
  if (res.error) throw res.error;
  return true;
}

/** Clear (hide) history before a timestamp for the current user. */
export async function clearHistoryBefore(conversationId, isoTimestamp = nowIso()) {
  const me = await requireAuthUserId();
  const res = await supabase
    .from('conversation_members')
    .update({ cleared_before: isoTimestamp })
    .eq('conversation_id', conversationId)
    .eq('user_id', me);
  if (res.error) throw res.error;
  return true;
}

/* ============================== VPORT DMs ============================== */

/**
 * Get or create a vport conversation between *me* and a specific vport.
 * Ensures vport_conversations row + membership in vport_conversation_members.
 */
export async function getOrCreateVport({ vportId }) {
  const me = await requireAuthUserId();
  if (!vportId) throw new Error('vportId required');

  // Find an existing convo for this vport that I’m a member of
  const mem = await supabase
    .from('vport_conversation_members')
    .select('conversation_id')
    .eq('user_id', me);
  if (mem.error) throw mem.error;

  const myConvoIds = (mem.data || []).map((r) => r.conversation_id);
  let conversationId = null;

  if (myConvoIds.length) {
    const find = await supabase
      .from('vport_conversations')
      .select('id')
      .eq('vport_id', vportId)
      .in('id', myConvoIds)
      .maybeSingle();
    if (find.error && find.error.code !== 'PGRST116') throw find.error;
    conversationId = find.data?.id || null;
  }

  // Create if missing
  if (!conversationId) {
    const insConv = await supabase
      .from('vport_conversations')
      .insert({ vport_id: vportId, kind: 'dm', updated_at: nowIso() })
      .select('id')
      .single();
    if (insConv.error) throw insConv.error;
    conversationId = insConv.data.id;

    const insMem = await supabase
      .from('vport_conversation_members')
      .insert({ conversation_id: conversationId, user_id: me });
    if (insMem.error) throw insMem.error;
  }

  return { id: conversationId };
}

/** List my vport conversations (newest first), with vport info. */
export async function listVportConversations({ limit = 50, offset = 0 } = {}) {
  const me = await requireAuthUserId();

  const res = await supabase
    .from('vport_conversation_members')
    .select(`
      conversation_id,
      conversation:conversation_id ( id, vport_id, kind, updated_at ),
      vport:vport_id ( id, name, avatar_url, verified )
    `)
    .eq('user_id', me)
    .order('conversation.updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (res.error) throw res.error;

  return (res.data || []).map((row) => ({
    id: row.conversation?.id,
    vport: row.vport,
    updated_at: row.conversation?.updated_at,
    kind: row.conversation?.kind,
  }));
}

/** Fetch a single vport DM header for the current user (vport + my member flags). */
export async function getVportConversationHeader(conversationId) {
  const me = await requireAuthUserId();
  const res = await supabase
    .from('vport_conversation_members')
    .select(`
      conversation_id,
      conversation:conversation_id ( id, vport_id, kind, updated_at ),
      vport:vport_id ( id, name, avatar_url, verified )
    `)
    .eq('user_id', me)
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (res.error) throw res.error;
  if (!res.data) throw new Error('Vport conversation not found');

  // For parity with user DMs, also fetch my member flags
  const myFlags = await supabase
    .from('vport_conversation_members')
    .select('muted, archived_at, cleared_before')
    .eq('user_id', me)
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (myFlags.error) throw myFlags.error;

  return {
    id: res.data.conversation?.id,
    vport: res.data.vport,
    kind: res.data.conversation?.kind,
    updated_at: res.data.conversation?.updated_at,
    muted: myFlags.data?.muted ?? false,
    archived_at: myFlags.data?.archived_at ?? null,
    cleared_before: myFlags.data?.cleared_before ?? null,
  };
}

/**
 * DAL wrapper that uses your Postgres RPC to ensure a vport↔user DM.
 * Returns the vport_conversations.id (string) or throws on error.
 */
export async function startVportConversation(vportId, receiverUserId) {
  const me = await requireAuthUserId();
  if (!vportId || !receiverUserId || receiverUserId === me) {
    throw new Error('Invalid parameters for startVportConversation');
  }
  const { data, error } = await supabase.rpc('get_or_create_vport_conversation', {
    vport: vportId,
    user_b: receiverUserId,
    manager: me,
  });
  if (error) throw error;
  return (typeof data === 'string' ? data : data?.id) || null;
}

/** List messages in a vport conversation (oldest first). */
export async function listVportMessages(conversationId, { limit = 50, before = null } = {}) {
  await requireAuthUserId();
  let q = supabase
    .from('vport_messages')
    .select(
      `
      id, conversation_id, sender_user_id, sender_vport_id, content, media_url, media_type, created_at,
      user:sender_user_id ( id, display_name, username, photo_url ),
      vport:sender_vport_id ( id, name, avatar_url )
    `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (before) q = q.lt('created_at', before);

  const res = await q;
  if (res.error) throw res.error;
  return res.data || [];
}

/** Send a message in a vport conversation (as user by default; support as vport if needed). */
export async function sendVportMessage(conversationId, {
  content = '',
  media_url = null,
  media_type = null,
  asVport = false,
  vportId = null,
} = {}) {
  const me = await requireAuthUserId();
  if (!conversationId) throw new Error('conversationId required');
  if (!content && !media_url) throw new Error('Message must have content or media');

  const payload = {
    conversation_id: conversationId,
    content: content || null,
    media_url: media_url || null,
    media_type: media_type || null,
    sender_user_id: asVport ? null : me,
    sender_vport_id: asVport ? vportId : null,
  };

  const ins = await supabase.from('vport_messages').insert(payload).select('id, created_at').single();
  if (ins.error) throw ins.error;

  const upd = await supabase
    .from('vport_conversations')
    .update({ updated_at: nowIso() })
    .eq('id', conversationId);
  if (upd.error) throw upd.error;

  return ins.data;
}

/* ------------------------------ export -------------------------------- */

export const chat = {
  // user DMs
  getOrCreateDirect,
  getOrCreateDirectVisible,
  listConversations,
  getConversationHeader,
  listMessages,
  sendMessage,
  setMuted,
  setArchived,
  clearHistoryBefore,
  // vport DMs
  getOrCreateVport,
  listVportConversations,
  getVportConversationHeader,
  startVportConversation,
  listVportMessages,
  sendVportMessage,
};

export default chat;
