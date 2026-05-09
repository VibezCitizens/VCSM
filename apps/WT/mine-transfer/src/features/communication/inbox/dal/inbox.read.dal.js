// src/features/chat/inbox/dal/inbox.read.dal.js
// ============================================================
// Inbox READ DAL
// ------------------------------------------------------------
// Raw database reads only.
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

const MESSAGE_SELECT =
  "id,body,message_type,media_url,created_at,deleted_at";

const CONVERSATION_MEMBER_SELECT = `
  conversation_id,
  actor_id,
  role,
  is_active,
  actor:actor_presentation (
    actor_id,
    kind,
    display_name,
    username,
    photo_url,
    vport_name,
    vport_slug,
    vport_avatar_url
  )
`;

export async function getInboxEntries({
  actorId,
  includeArchived = false,
  folder = "inbox",
}) {
  if (!actorId) {
    throw new Error("[getInboxEntries] actorId required");
  }

  let query = supabase
    .schema("vc")
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
      last_message:messages!inbox_entries_last_message_id_fkey (
        ${MESSAGE_SELECT}
      ),
      conversation:conversations (
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

  if (error) {
    console.error("[getInboxEntries] error", error);
    throw new Error("[getInboxEntries] query failed");
  }

  return Array.isArray(data) ? data : [];
}

export async function listActiveConversationMembershipRowsByActorDAL({
  actorId,
}) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .select("conversation_id")
    .eq("actor_id", actorId)
    .eq("is_active", true);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listConversationsByIdsDAL({ conversationIds }) {
  const ids = [...new Set((conversationIds ?? []).filter(Boolean))];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("conversations")
    .select("id,last_message_id,last_message_at")
    .in("id", ids);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listConversationMemberRowsByConversationIdsDAL({
  conversationIds,
}) {
  const ids = [...new Set((conversationIds ?? []).filter(Boolean))];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .select(CONVERSATION_MEMBER_SELECT)
    .in("conversation_id", ids);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listMessageRowsByIdsDAL({ messageIds }) {
  const ids = [...new Set((messageIds ?? []).filter(Boolean))];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .schema("vc")
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

  const { data, error } = await supabase
    .schema("vc")
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

  const { count, error } = await supabase
    .schema("vc")
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

  const { data, error } = await supabase
    .schema("vc")
    .from("inbox_entries")
    .select("history_cutoff_at")
    .eq("actor_id", actorId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("[getConversationHistoryCutoff] error", error);
    throw error;
  }

  return data?.history_cutoff_at ?? null;
}
