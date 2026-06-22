// ============================================================
// Feed Posts DAL (legacy — used by dev diagnostics only)
// ------------------------------------------------------------
// The main feed pipeline uses feed.read.posts.dal + actorsBundle.
// This file exists for backward compat with diagnostics groups.
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";
import { hydrateAndReturnSummaries } from "@hydration";

export async function listFeedPosts({ limit = 20 } = {}) {
  if (!import.meta.env.DEV) return [];
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      created_at,
      comment_count:post_comments(count)
    `)
    .eq("post_comments.parent_id", null)
    .is("post_comments.deleted_at", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data) return [];

  const actorIds = [...new Set(data.map((r) => r.actor_id).filter(Boolean))];
  const { rows: actorRows } = await hydrateAndReturnSummaries({ actorIds });
  const actorById = new Map((actorRows ?? []).map((a) => [a.actor_id, a]));

  return data.map((post) => {
    const a = actorById.get(post.actor_id) ?? null;
    return {
      id: post.id,
      text: post.text,
      created_at: post.created_at,
      actor: a
        ? {
            id: a.actor_id,
            kind: a.kind,
            displayName: a.display_name ?? null,
            username: a.username ?? null,
            avatar: a.photo_url ?? null,
          }
        : null,
      comment_count: post.comment_count?.[0]?.count ?? 0,
    };
  });
}
