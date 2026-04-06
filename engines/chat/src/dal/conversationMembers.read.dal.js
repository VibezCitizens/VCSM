// src/dal/conversationMembers.read.dal.js

import { getSupabaseClient } from '../config.js'

const MEMBER_SELECT = `
  actor_id,
  role,
  membership_status,
  can_post,
  can_manage,
  can_moderate
`;

export async function getConversationMembersDAL({ conversationId }) {
  if (!conversationId) {
    throw new Error("[getConversationMembersDAL] conversationId required");
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("conversation_members")
    .select(MEMBER_SELECT)
    .eq("conversation_id", conversationId);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getConversationMemberDAL({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error("[getConversationMemberDAL] missing params");
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("conversation_members")
    .select(MEMBER_SELECT)
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
