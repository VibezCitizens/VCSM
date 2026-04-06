// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\model\normalizeFeedRows.js
import { inferMediaType } from "@/features/feed/model/inferMediaType";
import { resolveFeedRowVisibilityModel } from "@/features/feed/model/feedRowVisibility.model";

export function normalizeFeedRows({
  pageRows,
  actorMap,
  profileMap,
  vportMap,
  blockedActorSet,
  followedActorSet,
  viewerActorId,
  hiddenByMeSet,
  mediaMap,
  mentionMapsByPostId,
  includeDebug = false,
}) {
  const debugRows = [];

  const normalized = (pageRows || [])
    .filter((r) => {
      const visibility = resolveFeedRowVisibilityModel({
        row: r,
        actorMap,
        profileMap,
        vportMap,
        blockedActorSet,
        followedActorSet,
        viewerActorId,
      });

      if (includeDebug) {
        debugRows.push(visibility);
      }

      return visibility.visible;
    })
    .map((r) => {
      const a = actorMap[r.actor_id];
      const prof = a?.profile_id ? profileMap[a.profile_id] : null;
      const vp = a?.vport_id ? vportMap[a.vport_id] : null;

      const multi = (mediaMap.get(r.id) || [])
        .map((mediaRow) => {
          const url = mediaRow?.url ?? null;
          if (!url) return null;

          const rawType = mediaRow?.media_type ?? null;
          const inferredType = rawType || inferMediaType(url);

          return {
            type: inferredType === "video" ? "video" : "image",
            url,
          };
        })
        .filter(Boolean);
      const legacy = r.media_url
        ? [{ type: r.media_type || inferMediaType(r.media_url), url: r.media_url }]
        : [];
      const media = multi.length ? multi : legacy;

      return {
        id: r.id,
        text: r.text || "",
        title: r.title || "",
        created_at: r.created_at,
        edited_at: r.edited_at ?? null,
        deleted_at: r.deleted_at ?? null,
        deleted_by_actor_id: r.deleted_by_actor_id ?? null,
        post_type: r.post_type || "post",
        actor_id: r.actor_id,

        // ✅ ADD THIS (so PostCardView can show 📍)
        location_text: r.location_text ?? null,

        is_hidden_for_viewer: hiddenByMeSet.has(r.id),

        actor: {
          id: a.id,
          kind: a.kind,
          displayName: a.kind === "vport" ? vp?.name ?? null : prof?.display_name ?? null,
          username: a.kind === "vport" ? vp?.slug ?? null : prof?.username ?? null,
          avatar: a.kind === "vport" ? vp?.avatar_url ?? null : prof?.photo_url ?? null,
          vport_name: vp?.name ?? null,
          vport_slug: vp?.slug ?? null,
        },

        media,
        mentionMap: mentionMapsByPostId?.[r.id] || {},
      };
    });

  return {
    normalized,
    debugRows,
  };
}
