import {
  createQuestionRow,
  invokeQuestionConfirmation
} from "@/features/answers/dal/questions.write.dal";
import { buildQuestionSubmission } from "@/features/answers/models/questionSubmission.model";

export async function submitQuestion(input = {}) {
  const submission = buildQuestionSubmission(input);
  if (!submission.ok) {
    return {
      ok: false,
      status: "invalid",
      errors: submission.errors
    };
  }

  // Slug + collision retry are owned by the answers.submit_question RPC.
  const { data, error } = await createQuestionRow(submission.value);

  if (error || !data) {
    return {
      ok: false,
      status: "failed",
      errors: {
        form: error?.message || "Question could not be submitted."
      }
    };
  }

  // Fire-and-forget confirmation email. Only attempted when an email was given;
  // the DAL guards and never throws, and we deliberately do NOT await, so a slow
  // or failing email can never block or fail the question submission.
  void invokeQuestionConfirmation({
    email: submission.value.askerEmail,
    name: submission.value.askerName,
    title: submission.value.title
  });

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
