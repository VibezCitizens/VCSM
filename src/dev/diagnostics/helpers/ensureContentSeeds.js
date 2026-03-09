import { supabase } from "@/services/supabase/supabaseClient";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureRealm } from "@/dev/diagnostics/helpers/ensureRealm";
import { isUniqueViolation } from "@/dev/diagnostics/helpers/supabaseAssert";
import { markerForUser } from "@/dev/diagnostics/helpers/seedMarker";

export async function ensureBasicPost(shared) {
  if (shared?.cache?.seedPost) return shared.cache.seedPost;

  const { actorId, userId } = await ensureActorContext(shared);
  const { realmId } = await ensureRealm(shared);
  const marker = markerForUser(userId, "post");

  const { data: existing, error: readError } = await supabase
    .schema("vc")
    .from("posts")
    .select("id,actor_id,user_id,text,realm_id,created_at")
    .eq("actor_id", actorId)
    .ilike("text", `%${marker}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) throw readError;

  if (existing?.id) {
    if (shared?.cache) shared.cache.seedPost = existing;
    return existing;
  }

  const payloadCandidates = [{ actor_id: actorId, user_id: userId, text: `Diagnostics post ${marker}`, realm_id: realmId }];

  let created = null;
  let lastError = null;

  for (const payload of payloadCandidates) {
    const { data, error } = await supabase
      .schema("vc")
      .from("posts")
      .insert(payload)
      .select("id,actor_id,user_id,text,realm_id,created_at")
      .maybeSingle();

    if (!error && data?.id) {
      created = data;
      break;
    }

    lastError = error;
  }

  if (!created?.id) {
    throw lastError ?? new Error("Failed to ensure basic post seed.");
  }

  if (shared?.cache) shared.cache.seedPost = created;
  return created;
}

export async function ensureBasicConversation(shared) {
  if (shared?.cache?.seedConversation) return shared.cache.seedConversation;

  const { actorId, userId } = await ensureActorContext(shared);
  const { realmId } = await ensureRealm(shared);
  const marker = markerForUser(userId, "conversation");

  const { data: existing, error: readError } = await supabase
    .schema("vc")
    .from("conversations")
    .select("id,is_group,created_by_actor_id,title,realm_id,created_at")
    .eq("created_by_actor_id", actorId)
    .eq("title", marker)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) throw readError;

  let conversation = existing;

  if (!conversation?.id) {
    const { data, error } = await supabase
      .schema("vc")
      .from("conversations")
      .insert({
        is_group: false,
        created_by_actor_id: actorId,
        realm_id: realmId,
        title: marker,
      })
      .select("id,is_group,created_by_actor_id,title,realm_id,created_at")
      .maybeSingle();

    if (error) throw error;
    conversation = data;
  }

  if (!conversation?.id) {
    throw new Error("Failed to ensure conversation seed.");
  }

  const { error: memberError } = await supabase
    .schema("vc")
    .from("conversation_members")
    .upsert(
      {
        conversation_id: conversation.id,
        actor_id: actorId,
        role: "member",
        is_active: true,
      },
      { onConflict: "conversation_id,actor_id" }
    );

  if (memberError && !isUniqueViolation(memberError)) {
    throw memberError;
  }

  const { error: inboxError } = await supabase
    .schema("vc")
    .from("inbox_entries")
    .upsert(
      {
        conversation_id: conversation.id,
        actor_id: actorId,
        folder: "inbox",
        archived: false,
        archived_until_new: false,
      },
      { onConflict: "conversation_id,actor_id" }
    );

  if (inboxError && !isUniqueViolation(inboxError)) {
    throw inboxError;
  }

  if (shared?.cache) shared.cache.seedConversation = conversation;
  return conversation;
}

export async function ensureReportableObject(shared) {
  if (shared?.cache?.seedReportable) return shared.cache.seedReportable;

  const [post, conversation] = await Promise.all([
    ensureBasicPost(shared),
    ensureBasicConversation(shared),
  ]);

  const seed = {
    postId: post.id,
    conversationId: conversation.id,
  };

  if (shared?.cache) shared.cache.seedReportable = seed;
  return seed;
}
