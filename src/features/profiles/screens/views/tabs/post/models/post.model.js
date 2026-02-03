// src/features/profiles/screens/views/tabs/post/models/post.model.js

export function PostModel(row) {
  const hydratedMedia = Array.isArray(row?.media) ? row.media.filter(Boolean) : [];

  const media =
    hydratedMedia.length
      ? hydratedMedia
          .map((m) => ({
            type: m.type || m.media_type,
            url: m.url || m.media_url,
          }))
          .filter((m) => !!m.type && !!m.url)
      : row.media_url
        ? [
            {
              type: row.media_type,
              url: row.media_url,
            },
          ]
        : [];

  return {
    id: row.id,
    actorId: row.actor_id,
    text: row.text ?? "",
    created_at: row.created_at,
    edited_at: row.edited_at ?? null,
    deleted_at: row.deleted_at ?? null,
    deleted_by_actor_id: row.deleted_by_actor_id ?? null,
    media,

    // ✅ so PostCard gets it in profile tab
    mentionMap: row.mentionMap || {},

    // ✅ location support
    location_text: row.location_text ?? null,
  };
}
