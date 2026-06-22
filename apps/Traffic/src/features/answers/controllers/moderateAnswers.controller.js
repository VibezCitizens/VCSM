import {
  createModerationAnswerRow,
  listModerationAnswerRowsByQuestionIds,
  updateAnswerModerationRow
} from "@/features/answers/dal/moderationAnswers.dal";
import {
  listModerationQuestionRows,
  updateQuestionModerationRow
} from "@/features/answers/dal/moderationQuestions.dal";
import { buildModerationAnswerSubmission } from "@/features/answers/models/moderationAnswer.model";
import { mapModerationQueue } from "@/features/answers/models/moderationQueue.model";

function nowIso() {
  return new Date().toISOString();
}

function cleanNote(value) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, 500) || null;
}

export async function listAnswersModerationQueue() {
  const { data: questions, error: questionError } = await listModerationQuestionRows();
  if (questionError) return { ok: false, error: questionError.message };

  const questionIds = questions.map((question) => question.id);
  const { data: answers, error: answerError } = await listModerationAnswerRowsByQuestionIds(questionIds);
  if (answerError) return { ok: false, error: answerError.message };

  return {
    ok: true,
    questions: mapModerationQueue(questions, answers)
  };
}

export async function moderateQuestion({ id, action, note }) {
  const timestamp = nowIso();
  const moderationNote = cleanNote(note);
  const valuesByAction = {
    approve: {
      status: "published",
      is_published: true,
      is_moderated: true,
      moderation_status: "approved",
      moderated_at: timestamp,
      moderation_note: moderationNote,
      published_at: timestamp
    },
    reject: {
      status: "archived",
      is_published: false,
      is_moderated: true,
      moderation_status: "rejected",
      moderated_at: timestamp,
      moderation_note: moderationNote
    }
  };

  const values = valuesByAction[action];
  if (!id || !values) return { ok: false, error: "Invalid question moderation action." };

  const { data, error } = await updateQuestionModerationRow({ id, values });
  if (error) return { ok: false, error: error.message };

  return { ok: true, question: data };
}

export async function createModerationAnswer(input = {}) {
  const submission = buildModerationAnswerSubmission(input);
  if (!submission.ok) return { ok: false, errors: submission.errors };

  const { data, error } = await createModerationAnswerRow(submission.value);
  if (error) return { ok: false, error: error.message };

  return { ok: true, answer: data };
}

export async function moderateAnswer({ id, action, note }) {
  const timestamp = nowIso();
  const moderationNote = cleanNote(note);
  const valuesByAction = {
    publish: {
      status: "published",
      is_published: true,
      is_moderated: true,
      is_accepted: true,
      moderation_status: "approved",
      moderated_at: timestamp,
      moderation_note: moderationNote,
      published_at: timestamp
    },
    reject: {
      status: "archived",
      is_published: false,
      is_moderated: true,
      is_accepted: false,
      moderation_status: "rejected",
      moderated_at: timestamp,
      moderation_note: moderationNote
    }
  };

  const values = valuesByAction[action];
  if (!id || !values) return { ok: false, error: "Invalid answer moderation action." };

  const { data, error } = await updateAnswerModerationRow({ id, values });
  if (error) return { ok: false, error: error.message };

  return { ok: true, answer: data };
}
