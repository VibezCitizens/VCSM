import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

export async function readHiddenPostsForViewer({ viewerActorId, postIds }) {
  let hiddenByMeSet = new Set();

  if (!viewerActorId || !isUuid(viewerActorId) || !Array.isArray(postIds) || postIds.length === 0) {
    return hiddenByMeSet;
  }

  const { data: actions, error: actionsErr } = await supabase
    .schema("moderation")
    .from("actions")
    .select("target_id, action_type, created_at")
    .eq("actor_id", viewerActorId)
    .eq("target_type", "post")
    .in("target_id", postIds)
    .in("action_type", ["hide", "unhide"])
    .order("created_at", { ascending: false });

  if (actionsErr || !Array.isArray(actions) || actions.length === 0) {
    return hiddenByMeSet;
  }

  const latest = new Map();
  for (const a of actions) {
    const id = a?.target_id;
    if (!id) continue;
    if (latest.has(id)) continue;
    latest.set(id, a.action_type);
  }

  hiddenByMeSet = new Set(
    Array.from(latest.entries())
      .filter(([, t]) => t === "hide")
      .map(([id]) => id)
  );

  return hiddenByMeSet;
}
