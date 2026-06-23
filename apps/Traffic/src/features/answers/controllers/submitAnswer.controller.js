import { submitAnswerRow } from "@/features/answers/dal/submitAnswer.write.dal";
import { buildAnswerSubmission } from "@/features/answers/models/answerSubmission.model";

export async function submitAnswer(input = {}) {
  const submission = buildAnswerSubmission(input);
  if (!submission.ok) {
    return { ok: false, status: "invalid", errors: submission.errors };
  }

  const { data, error } = await submitAnswerRow({
    questionSlug: input.questionSlug,
    ...submission.value
  });

  if (error || !data) {
    return {
      ok: false,
      status: "failed",
      errors: { form: error?.message || "Answer could not be submitted." }
    };
  }

  return {
    ok: true,
    status: "submitted",
    answer: {
      id: data.id,
      status: data.status,
      moderationStatus: data.moderation_status
    }
  };
}
