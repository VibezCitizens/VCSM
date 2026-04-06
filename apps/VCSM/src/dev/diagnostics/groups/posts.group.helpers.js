import { supabase } from "@/services/supabase/supabaseClient";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureSeedData";

export function getPostsState(shared) {
  if (!shared.cache.postsState) {
    shared.cache.postsState = {};
  }
  return shared.cache.postsState;
}

export async function getOrCreateTestComment({ postId, actorId, shared }) {
  const state = getPostsState(shared);
  if (state.comment?.id) return state.comment;

  const marker = `Diagnostics comment ${Date.now()}`;

  const { data, error } = await supabase
    .schema("vc")
    .from("post_comments")
    .insert({
      post_id: postId,
      actor_id: actorId,
      content: marker,
      parent_id: null,
    })
    .select("id,post_id,parent_id,actor_id,content,created_at,deleted_at")
    .maybeSingle();

  if (error) throw error;

  state.comment = data;
  return data;
}

export async function resolveMentionTargetActor({ actorId, shared }) {
  try {
    const vport = await ensureBasicVport(shared);
    if (vport?.actorId && vport.actorId !== actorId) {
      return vport.actorId;
    }
  } catch {
    // best effort
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(1);

  if (error) throw error;
  return data?.[0]?.actor_id ?? null;
}

async function findOwnedActorIds({ actorId, userId }) {
  const ownedActorIds = new Set([actorId]);

  if (!userId) {
    return ownedActorIds;
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId);

  if (error) throw error;

  for (const row of data ?? []) {
    if (row?.actor_id) {
      ownedActorIds.add(row.actor_id);
    }
  }

  return ownedActorIds;
}

export async function findForeignPostId({ actorId, userId }) {
  const ownedActorIds = await findOwnedActorIds({ actorId, userId });

  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select("id,actor_id,created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const foreignPost = (data ?? []).find((post) => post?.actor_id && !ownedActorIds.has(post.actor_id));
  return foreignPost?.id ?? null;
}
