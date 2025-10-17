/* eslint-disable no-console */
import { supabase } from "@/lib/supabaseClient";

/* ----------------------------- Utils / helpers ----------------------------- */
function assertOk({ data, error, hint }) {
  if (error) {
    const e = new Error(hint ? `${hint}: ${error.message}` : error.message);
    e.cause = error;
    throw e;
  }
  return data;
}
function normalizeActors(ids = []) {
  return Array.from(new Set(ids.filter(Boolean))).sort();
}
function privateKey(actorA, actorB) {
  return normalizeActors([actorA, actorB]).join("::");
}
async function getMeId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data?.user?.id;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

/**
 * Ensure there is a vc.actors row for this user (kind='user') and return its id.
 * Assumes vc.actors(profile_id, kind) with kind in ('user','vport').
 */
async function ensureUserActorId(userId) {
  // Try existing
  const { data: existing, error: selErr } = await supabase
    .schema("vc")
    .from("actors")
    .select("id")
    .eq("profile_id", userId)
    .eq("kind", "user")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing?.id) return existing.id;

  // Create if missing (RLS policy must allow inserting your own actor)
  const { data: inserted, error: insErr } = await supabase
    .schema("vc")
    .from("actors")
    .insert([{ profile_id: userId, kind: "user" }])
    .select("id")
    .single();

  if (insErr) throw new Error(`ensureUserActorId failed: ${insErr.message}`);
  return inserted.id;
}

/**
 * Ensure there is a vc.actors row for this VPORT (kind='vport') and return its id.
 * We store vportId in actors.profile_id with kind='vport'.
 */
async function ensureVportActorId(vportId) {
  if (!vportId) throw new Error("ensureVportActorId: missing vportId");

  const { data: existing, error: selErr } = await supabase
    .schema("vc")
    .from("actors")
    .select("id")
    .eq("profile_id", vportId)
    .eq("kind", "vport")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing?.id) return existing.id;

  const { data: inserted, error: insErr } = await supabase
    .schema("vc")
    .from("actors")
    .insert([{ profile_id: vportId, kind: "vport" }])
    .select("id")
    .single();

  if (insErr) throw new Error(`ensureVportActorId failed: ${insErr.message}`);
  return inserted.id;
}

/* --------------------------------- Reads ---------------------------------- */
export async function getConversationById(conversationId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("conversations")
    .select(
      `
      id,
      pair_key,
      created_at,
      conversation_members:conversation_members (
        user_id,
        partner_user_id,
        muted,
        archived_at,
        cleared_before,
        last_read_at,
        created_at
      )
    `
    )
    .eq("id", conversationId)
    .single();
  return assertOk({ data, error, hint: "getConversationById failed" });
}

export async function listMessages(conversationId, { limit = 50, before } = {}) {
  let query = supabase
    .schema("vc")
    .from("messages")
    .select(
      `
      id,
      conversation_id,
      sender_id,
      sender_user_id,
      actor_id,
      content,
      media_url,
      media_type,
      created_at
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  return assertOk({ data, error, hint: "listMessages failed" });
}

export async function getConversationHeader(conversationId) {
  const meId = await getMeId();
  const { data, error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .select("muted, archived_at, cleared_before, partner_user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", meId)
    .maybeSingle();
  return assertOk({ data, error, hint: "getConversationHeader failed" });
}

/* --------------------------------- Writes --------------------------------- */
export async function createConversation({ id, pairKey = null } = {}) {
  const convId =
    id ??
    (typeof crypto !== "undefined" && crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const { error } = await supabase
    .schema("vc")
    .from("conversations")
    .insert([{ id: convId, pair_key: pairKey }], { returning: "minimal" });

  if (error && error.code !== "23505") {
    throw new Error(`createConversation failed: ${error.message}`);
  }
  return { id: convId, pair_key: pairKey };
}

/**
 * CLIENT-SAFE: insert/update ONLY *my* membership row. RLS allows this.
 */
export async function addMyMembership(conversationId, partnerUserId) {
  const meId = await getMeId();
  const { data, error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .upsert(
      [{ conversation_id: conversationId, user_id: meId, partner_user_id: partnerUserId }],
      { onConflict: "conversation_id,user_id" }
    )
    .select("conversation_id, user_id, partner_user_id, created_at")
    .maybeSingle();
  return assertOk({ data, error, hint: "addMyMembership failed" });
}

/**
 * (DEPRECATED client-side) Try not to call this from the client; RLS will block
 * the partner row. Kept for server-side/backwards compat.
 */
export async function addMembers(conversationId, userIds = []) {
  const ids = normalizeActors(userIds);
  if (ids.length !== 2) {
    throw new Error("addMembers expects exactly two distinct user ids");
  }
  const [a, b] = ids;
  const rows = [
    { conversation_id: conversationId, user_id: a, partner_user_id: b },
    { conversation_id: conversationId, user_id: b, partner_user_id: a },
  ];

  const { data, error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .upsert(rows, { onConflict: "conversation_id,user_id" })
    .select("conversation_id, user_id, created_at");

  return assertOk({ data, error, hint: "addMembers failed" });
}

/**
 * USER-actor message (current behavior).
 * Keeps sender_user_id populated with the authed user and actor_id -> user actor.
 */
export async function addMessage(
  conversationId,
  senderId,
  { content, media_url = null, media_type = "text", media_mime = null }
) {
  // Ensure the sender has a 'user' actor (vc.messages.actor_id is NOT NULL)
  const actorId = await ensureUserActorId(senderId);

  const { data: message, error } = await supabase
    .schema("vc")
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_user_id: senderId,
        actor_id: actorId,
        content,
        media_url,
        media_type,
        media_mime,
      },
    ])
    .select(
      "id, conversation_id, sender_id, sender_user_id, actor_id, content, media_url, media_type, created_at"
    )
    .single();

  return assertOk({ data: message, error, hint: "addMessage failed" });
}

/**
 * VPORT-actor message (NEW).
 * - actor_id points to the vport actor (kind='vport', profile_id=vportId)
 * - sender_user_id remains the authed user for audit (can be null if your schema allows)
 */
export async function addVportMessage(
  conversationId,
  vportId,
  { content, media_url = null, media_type = "text", media_mime = null }
) {
  if (!vportId) throw new Error("addVportMessage: missing vportId");
  const meId = await getMeId();
  const vportActorId = await ensureVportActorId(vportId);

  const { data: message, error } = await supabase
    .schema("vc")
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        sender_id: meId,            // keep audit user if your schema requires non-null
        sender_user_id: meId,       // set to null if allowed and you prefer pure-actor records
        actor_id: vportActorId,     // <-- drives rendering as VPORT
        content,
        media_url,
        media_type,
        media_mime,
      },
    ])
    .select(
      "id, conversation_id, sender_id, sender_user_id, actor_id, content, media_url, media_type, created_at"
    )
    .single();

  return assertOk({ data: message, error, hint: "addVportMessage failed" });
}

export async function markConversationRead(conversationId) {
  const meId = await getMeId();
  const now = new Date().toISOString();

  // update my last_read_at
  const { error: e1 } = await supabase
    .schema("vc")
    .from("conversation_members")
    .update({ last_read_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", meId);
  assertOk({ data: true, error: e1, hint: "markConversationRead failed (members)" });

  // zero my unread counter so badge drops
  const { error: e2 } = await supabase
    .schema("vc")
    .from("inbox_entries")
    .update({ unread_count: 0 })
    .eq("conversation_id", conversationId)
    .eq("user_id", meId);
  assertOk({ data: true, error: e2, hint: "markConversationRead failed (inbox_entries)" });

  return true;
}

/* --------------------- High-level helpers ------------------ */
export async function getOrCreatePrivateConversation(userIdA, userIdB) {
  const [a, b] = normalizeActors([userIdA, userIdB]);
  const pairKey = `${a}::${b}`;

  // 1) read by pair_key
  const { data: existing, error: findErr } = await supabase
    .schema("vc")
    .from("conversations")
    .select("id, pair_key")
    .eq("pair_key", pairKey)
    .maybeSingle();
  if (!findErr && existing?.id) return existing;

  // 2) create (unique race OK)
  const id =
    typeof crypto !== "undefined" && crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await createConversation({ id, pairKey });

  // 3) add ONLY my membership (client-side allowed). Partner row is created later.
  const me = await getMeId();
  const partner = me === a ? b : a;
  await addMyMembership(id, partner);

  // 4) return canonical row
  const { data, error } = await supabase
    .schema("vc")
    .from("conversations")
    .select("id, pair_key")
    .eq("pair_key", pairKey)
    .single();
  return assertOk({ data, error, hint: "get conversation failed" });
}

/* -------------------- UI-facing wrappers / bridges -------------------- */
export async function sendMessage(conversationId, payload) {
  const meId = await getMeId();
  return addMessage(conversationId, meId, payload);
}

/**
 * NEW: send a message AS a VPORT actor.
 * Call this from your /vport/chat/:id composer.
 */
export async function sendVportMessage(conversationId, vportId, payload) {
  return addVportMessage(conversationId, vportId, payload);
}

export async function getOrCreateDirectVisible(
  otherUserId,
  { restoreHistory = false } = {}
) {
  const meId = await getMeId();
  const conv = await getOrCreatePrivateConversation(meId, otherUserId);

  const patch = {
    archived_at: null,
    partner_user_id: otherUserId,
    ...(restoreHistory ? { cleared_before: null } : {}),
  };

  const { error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .update(patch)
    .eq("conversation_id", conv.id)
    .eq("user_id", meId);

  assertOk({ data: true, error, hint: "make conversation visible failed" });
  return { id: conv.id, members: [meId, otherUserId] };
}

export async function startVportConversation(vportId, receiverUserId) {
  if (!vportId || !receiverUserId) throw new Error("Missing vportId or receiverUserId");
  const meId = await getMeId();
  const [a, b] = normalizeActors([meId, receiverUserId]);
  const pairKey = `vpc:${vportId}::${a}::${b}`;

  const { data: existing, error: findErr } = await supabase
    .schema("vc")
    .from("conversations")
    .select("id, pair_key")
    .eq("pair_key", pairKey)
    .maybeSingle();
  if (existing?.id && !findErr) {
    // Only my row from client
    await addMyMembership(existing.id, meId === a ? b : a);
    return existing.id;
  }

  const conv = await createConversation({ pairKey });
  await addMyMembership(conv.id, meId === a ? b : a);
  return conv.id;
}

/* --------------------------------- Export --------------------------------- */
const chat = {
  normalizeActors,
  privateKey,
  getConversationById,
  listMessages,
  getConversationHeader,
  createConversation,
  addMyMembership,            // client-safe helper
  addMembers,                 // kept for server-side/backwards compat
  addMessage,
  addVportMessage,            // <-- NEW
  markConversationRead,
  getOrCreatePrivateConversation,
  sendPrivateMessage: async (userIdA, userIdB, authorId, payload) => {
    const conv = await getOrCreatePrivateConversation(userIdA, userIdB);
    const msg = await addMessage(conv.id, authorId, payload);
    return { conversation: conv, message: msg };
  },
  sendMessage,
  sendVportMessage,           // <-- NEW
  getOrCreateDirectVisible,
  startVportConversation,
};
export default chat;
