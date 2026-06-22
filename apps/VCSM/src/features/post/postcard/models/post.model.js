// models/post.model.js
// ============================================================
// PostModel
// ------------------------------------------------------------
// Normalizes post rows for UI consumption
// MUST preserve enriched actor object (SSOT)
// ============================================================

export function PostModel(row) {
  return {
    id: row.id,

    // ✅ PRESERVE ACTOR OBJECT (DO NOT COLLAPSE)
    actor: row.actor ?? null,

    text: row.text ?? "",
    createdAt: row.created_at,

    media: row.media_url
      ? [
          {
            type: row.media_type ?? "image",
            url: row.media_url,
          },
        ]
      : [],
  };
}
