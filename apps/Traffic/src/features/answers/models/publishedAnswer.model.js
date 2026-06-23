// Maps an answers.list_published_answers_for_question() row into the camelCase
// shape the public detail page consumes. Contact email is never included.

export function mapPublishedAnswerRow(row = {}) {
  return {
    id: row.id,
    body: row.body ?? "",
    expertDisplayName: row.expert_display_name ?? "TRAZE",
    expertProfileSlug: row.expert_profile_slug ?? null,
    expertServiceLabel: row.expert_service_label ?? null,
    publishedAt: row.published_at ?? null,
    isAccepted: Boolean(row.is_accepted)
  };
}
