import { createQuestionRow } from "@/features/answers/dal/questions.write.dal";
import { buildQuestionSubmission } from "@/features/answers/models/questionSubmission.model";

function makeSlug(base) {
  const suffix = globalThis.crypto?.randomUUID?.().slice(0, 8) ?? `${Date.now()}`;
  return `${base}-${suffix}`;
}

export async function submitQuestion(input = {}) {
  const submission = buildQuestionSubmission(input);
  if (!submission.ok) {
    return {
      ok: false,
      status: "invalid",
      errors: submission.errors
    };
  }

  const payload = {
    ...submission.value,
    slug: makeSlug(submission.value.slugBase)
  };
  const { data, error } = await createQuestionRow(payload);

  if (error) {
    return {
      ok: false,
      status: "failed",
      errors: {
        form: error.message || "Question could not be submitted."
      }
    };
  }

  return {
    ok: true,
    status: "submitted",
    question: {
      id: data.id,
      slug: data.slug,
      status: data.status,
      moderationStatus: data.moderation_status,
      createdAt: data.created_at
    }
  };
}
