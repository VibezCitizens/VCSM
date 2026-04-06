// src/dal/inbox.read.dal.js
// ============================================================
// Inbox READ DAL
// ------------------------------------------------------------
// Raw database reads only.
// ============================================================

import { getSupabaseClient } from '../config.js'

const MESSAGE_SELECT =
  "id,body,message_kind,created_at,deleted_at";

const CONVERSATION_MEMBER_SELECT = `
  conversation_id,
  actor_id,
  role,
  membership_status,
  can_post,
  can_manage,
  can_moderate
`;

export async function getInboxEntries({
  actorId,
  includeArchived = false,
  folder = "inbox",
}) {
  if (!actorId) {
    throw new Error("[getInboxEntries] actorId required");
  }

  const supabase = getSupabaseClient()

  let query = supabase
    .schema("chat")
    .from("inbox_entries")
    .select(`
      conversation_id,
      actor_id,
      last_message_id,
      last_message_at,
      unread_count,
      pinned,
      archived,
      muted,
      archived_until_new,
      history_cutoff_at,
      folder,
      partner_display_name,
      partner_username,
      partner_photo_url,
      last_message:messages!chat_inbox_entries_last_message_fk (
        ${MESSAGE_SELECT}
      ),
      conversation:conversations (
        id,
        conversation_kind,
        access_mode,
        visibility,
        scope_kind,
        scope_id,
        title,
        members:conversation_members (
          ${CONVERSATION_MEMBER_SELECT}
        )
      )
    `)
    .eq("actor_id", actorId)
    .eq("folder", folder);

  if (!includeArchived && folder === "inbox") {
    query = query.eq("archived", false).eq("archived_until_new", false);
  }

  const { data, error } = await query
    .order("pinned", { ascending: false })
    .order("last_message_at", { ascending: false });

  if (error) throw new Error("[getInboxEntries] query failed");

  return Array.isArray(data) ? data : [];
}

export async function listActiveConversationMembershipRowsByActorDAL({
  actorId,
}) {
  if (!actorId) return [];

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("conversation_members")
    .select("conversation_id")
    .eq("actor_id", actorId)
    .eq("membership_status", "active");

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listConversationsByIdsDAL({ conversationIds }) {
  const ids = [...new Set((conversationIds ?? []).filter(Boolean))];
  if (!ids.length) return [];

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("conversations")
    .select("id,last_message_id,last_message_at,conversation_kind,access_mode,visibility,scope_kind,scope_id,title")
    .in("id", ids);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listConversationMemberRowsByConversationIdsDAL({
  conversationIds,
}) {
  const ids = [...new Set((conversationIds ?? []).filter(Boolean))];
  if (!ids.length) return [];

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("conversation_members")
    .select(CONVERSATION_MEMBER_SELECT)
    .in("conversation_id", ids);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listMessageRowsByIdsDAL({ messageIds }) {
  const ids = [...new Set((messageIds ?? []).filter(Boolean))];
  if (!ids.length) return [];

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("messages")
    .select(MESSAGE_SELECT)
    .in("id", ids);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listRecentMessageRowsByConversationIdsDAL({
  conversationIds,
  limit,
}) {
  const ids = [...new Set((conversationIds ?? []).filter(Boolean))];
  if (!ids.length) return [];

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("messages")
    .select(`id,conversation_id,${MESSAGE_SELECT}`)
    .in("conversation_id", ids)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function readInboxEntryCountForActorDAL({ actorId }) {
  if (!actorId) return 0;

  const supabase = getSupabaseClient()

  const { count, error } = await supabase
    .schema("chat")
    .from("inbox_entries")
    .select("conversation_id", { count: "exact", head: true })
    .eq("actor_id", actorId);

  if (error) throw error;
  return Number(count || 0);
}

export async function getConversationHistoryCutoff({
  actorId,
  conversationId,
}) {
  if (!actorId || !conversationId) {
    throw new Error("[getConversationHistoryCutoff] missing params");
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("inbox_entries")
    .select("history_cutoff_at")
    .eq("actor_id", actorId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error) throw error;

  return data?.history_cutoff_at ?? null;
}
