// src/features/profiles/screens/views/tabs/post/models/post.model.js

export function PostModel(row) {
  return {
    id: row.id,
    actorId: row.actor_id,
    text: row.text ?? "",
    created_at: row.created_at,
    media: row.media_url
      ? [
          {
            type: row.media_type,
            url: row.media_url,
          },
        ]
      : [],
  };
}
