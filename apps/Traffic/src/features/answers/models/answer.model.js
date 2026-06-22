export function mapAnswerRowToAnswer(row) {
  if (!row) return null;

  return {
    id: row.id,
    questionId: row.question_id,
    body: row.body ?? "",
    status: row.status ?? "draft",
    isAccepted: row.is_accepted === true,
    isPublished: row.is_published === true,
    answeredAt: row.answered_at ?? row.published_at ?? row.created_at ?? null,
    publishedAt: row.published_at ?? null,
    updatedAt: row.updated_at ?? row.published_at ?? row.created_at ?? null,
    expert: {
      actorId: row.expert_actor_id ?? null,
      displayName: row.expert_display_name ?? "TRAZE expert",
      profileSlug: row.expert_profile_slug ?? null,
      serviceLabel: row.expert_service_label ?? null
    }
  };
}
