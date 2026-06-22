function mapAnswer(row) {
  return {
    id: row.id,
    questionId: row.question_id,
    body: row.body,
    status: row.status,
    isPublished: row.is_published === true,
    isModerated: row.is_moderated === true,
    moderationStatus: row.moderation_status ?? null,
    expertDisplayName: row.expert_display_name,
    expertServiceLabel: row.expert_service_label,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapQuestion(row, answersByQuestionId) {
  const answers = answersByQuestionId.get(row.id) ?? [];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    status: row.status,
    isPublished: row.is_published === true,
    isModerated: row.is_moderated === true,
    moderationStatus: row.moderation_status ?? null,
    moderationNote: row.moderation_note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answers: answers.map(mapAnswer)
  };
}

export function mapModerationQueue(questionRows = [], answerRows = []) {
  const answersByQuestionId = new Map();

  answerRows.forEach((row) => {
    const existing = answersByQuestionId.get(row.question_id) ?? [];
    existing.push(row);
    answersByQuestionId.set(row.question_id, existing);
  });

  return questionRows.map((row) => mapQuestion(row, answersByQuestionId));
}
