const PUBLISHED_STATUS = "published";
const APPROVED_MODERATION_STATUS = "approved";

export function mapPublicAnswerPageRowToQuestionRow(row) {
  if (!row) return null;

  return {
    id: row.question_id,
    slug: row.slug ?? "",
    title: row.title ?? "Untitled question",
    body: row.question_body ?? "",
    topic_id: row.topic_id ?? null,
    service_key: row.service_key ?? null,
    city: row.city ?? null,
    region: row.region ?? null,
    country: row.country ?? null,
    status: PUBLISHED_STATUS,
    is_published: true,
    is_moderated: true,
    moderation_status: APPROVED_MODERATION_STATUS,
    asked_at: row.asked_at ?? row.question_published_at ?? null,
    published_at: row.question_published_at ?? null,
    created_at: row.asked_at ?? row.question_published_at ?? null,
    updated_at: row.question_updated_at ?? row.question_published_at ?? null
  };
}

export function mapPublicAnswerPageRowToAnswerRow(row) {
  if (!row) return null;

  return {
    id: row.answer_id,
    question_id: row.question_id,
    expert_actor_id: row.expert_actor_id ?? null,
    expert_display_name: row.expert_display_name ?? "TRAZE",
    expert_profile_slug: row.expert_profile_slug ?? null,
    expert_service_label: row.expert_service_label ?? null,
    body: row.answer_body ?? "",
    status: PUBLISHED_STATUS,
    is_accepted: true,
    is_published: true,
    answered_at: row.answered_at ?? row.answer_published_at ?? null,
    published_at: row.answer_published_at ?? null,
    created_at: row.answered_at ?? row.answer_published_at ?? null,
    updated_at: row.answer_updated_at ?? row.answer_published_at ?? null
  };
}

export function mapPublicAnswerPageRowToTopicRow(row) {
  if (!row?.topic_id && !row?.topic_name) return null;

  return {
    id: row.topic_id ?? row.topic_slug ?? row.topic_name,
    slug: row.topic_slug ?? "",
    name: row.topic_name ?? "General",
    description: null,
    parent_id: null,
    is_active: true,
    sort_order: 0,
    created_at: null,
    updated_at: row.question_updated_at ?? row.answer_updated_at ?? null
  };
}

export function mapPublicAnswerPageRowToPageRows(row) {
  return {
    questionRow: mapPublicAnswerPageRowToQuestionRow(row),
    answerRow: mapPublicAnswerPageRowToAnswerRow(row),
    topicRow: mapPublicAnswerPageRowToTopicRow(row)
  };
}

export function mapPublicTopicRowToTopicRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug ?? "",
    name: row.name ?? "General",
    description: row.description ?? "",
    parent_id: row.parent_id ?? null,
    is_active: true,
    sort_order: row.sort_order ?? 0,
    created_at: null,
    updated_at: row.updated_at ?? null
  };
}

export function mapPublicAnswerCandidateRowToPageCandidate(row) {
  if (!row?.slug) return null;

  return {
    pageType: "answer",
    path: `/answers/${row.slug}`,
    updatedAt:
      row.answer_updated_at ??
      row.question_updated_at ??
      row.answer_published_at ??
      row.question_published_at ??
      null
  };
}
