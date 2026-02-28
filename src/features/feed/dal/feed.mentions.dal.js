import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Returns rows shaped for buildMentionMaps:
 * [{ post_id, mentioned_actor_id, username, slug }]
 */
export async function fetchPostMentionRows(postIds) {
  const ids = Array.isArray(postIds) ? postIds.filter(Boolean) : [];
  if (!ids.length) return [];

  // edges
  const { data: edges, error: eErr } = await supabase
    .schema("vc")
    .from("post_mentions")
    .select("post_id, mentioned_actor_id")
    .in("post_id", ids);

  if (eErr) {
    console.warn("[fetchPostMentionRows] post_mentions failed:", eErr);
    return [];
  }

  const safeEdges = Array.isArray(edges) ? edges : [];
  if (!safeEdges.length) return [];

  const mentionedActorIds = [
    ...new Set(safeEdges.map((e) => e.mentioned_actor_id).filter(Boolean)),
  ];
  if (!mentionedActorIds.length) return [];

  // Resolve mention identity in one read-model query.
  const { data: presentations, error: presErr } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select(
      "actor_id, kind, username, display_name, photo_url, vport_slug, vport_name, vport_avatar_url"
    )
    .in("actor_id", mentionedActorIds);

  if (presErr) throw presErr;

  const presentationByActorId = new Map(
    (presentations || [])
      .filter((row) => row?.actor_id)
      .map((row) => [row.actor_id, row])
  );

  // enrich edges so buildMentionMaps can stay pure/no-I/O
  return safeEdges.map((e) => {
    const p = presentationByActorId.get(e.mentioned_actor_id);

    return {
      ...e,
      kind: p?.kind ?? null,
      profile_id: null,
      vport_id: null,
      username: p?.username ?? null,
      display_name: p?.display_name ?? null,
      photo_url: p?.photo_url ?? null,
      slug: p?.vport_slug ?? null,
      vport_name: p?.vport_name ?? null,
      avatar_url: p?.vport_avatar_url ?? null,
    };
  });
}

/**
 * ✅ Backwards-compatible alias (in case some code imports a different name)
 */
export const readPostMentionRows = fetchPostMentionRows;
