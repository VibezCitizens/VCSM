import { supabase } from "@/services/supabase/supabaseClient";

export async function readHiddenPostsForViewer({ viewerActorId, postIds }) {
  let hiddenByMeSet = new Set();

  if (!viewerActorId || !Array.isArray(postIds) || postIds.length === 0) {
    return hiddenByMeSet;
  }

  const { data: actions, error: actionsErr } = await supabase
    .schema("vc")
    .from("moderation_actions")
    .select("object_id, action_type, created_at")
    .eq("actor_id", viewerActorId)
    .eq("object_type", "post")
    .in("object_id", postIds)
    .in("action_type", ["hide", "unhide"])
    .order("created_at", { ascending: false });

  if (actionsErr || !Array.isArray(actions) || actions.length === 0) {
    return hiddenByMeSet;
  }

  const latest = new Map(); // object_id -> action_type
  for (const a of actions) {
    const id = a?.object_id;
    if (!id) continue;
    if (latest.has(id)) continue; // newest first due to order desc
    latest.set(id, a.action_type);
  }

  hiddenByMeSet = new Set(
    Array.from(latest.entries())
      .filter(([, t]) => t === "hide")
      .map(([id]) => id)
  );

  return hiddenByMeSet;
}
