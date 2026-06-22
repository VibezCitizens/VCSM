export function mapQuestionRowToQuestion(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title ?? "Untitled question",
    body: row.body ?? "",
    topicId: row.topic_id ?? null,
    serviceKey: row.service_key ?? null,
    status: row.status ?? "draft",
    moderationStatus: row.moderation_status ?? null,
    isPublished: row.is_published === true,
    isModerated: row.is_moderated === true,
    askedAt: row.asked_at ?? row.created_at ?? null,
    publishedAt: row.published_at ?? null,
    updatedAt: row.updated_at ?? row.published_at ?? row.created_at ?? null,
    location: {
      city: row.city ?? null,
      region: row.region ?? null,
      country: row.country ?? null
    }
  };
}
