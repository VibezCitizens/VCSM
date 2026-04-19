// src/features/profiles/kinds/vport/model/content/VportContentPage.model.js

const str = (v) => String(v ?? "").trim();

export const VportContentPageModel = {
  fromRow(row) {
    if (!row) return null;

    return {
      id: row.id ?? null,
      actorId: row.actor_id ?? null,
      profileId: row.profile_id ?? null,
      title: str(row.title),
      slug: str(row.slug),
      excerpt: row.excerpt ?? null,
      body: row.body ?? null,
      category: row.category ?? null,
      serviceKeys: Array.isArray(row.service_keys) ? row.service_keys : [],
      isPublished: row.is_published ?? false,
      isIndexable: row.is_indexable ?? false,
      publishedAt: row.published_at ?? null,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    };
  },

  fromRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => VportContentPageModel.fromRow(r)).filter(Boolean);
  },
};

export default VportContentPageModel;
