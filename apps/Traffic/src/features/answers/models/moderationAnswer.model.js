const BODY_MAX_LENGTH = 4000;
const FIELD_MAX_LENGTH = 140;

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function buildModerationAnswerSubmission(input = {}) {
  const questionId = cleanText(input.questionId, FIELD_MAX_LENGTH);
  const body = cleanText(input.body, BODY_MAX_LENGTH);
  const expertDisplayName = cleanText(input.expertDisplayName || "TRAZE", FIELD_MAX_LENGTH);
  const expertServiceLabel = cleanText(input.expertServiceLabel, FIELD_MAX_LENGTH) || null;
  const expertProfileSlug = cleanText(input.expertProfileSlug, FIELD_MAX_LENGTH) || null;

  const errors = {};
  if (!questionId) errors.questionId = "Question is required.";
  if (!body) errors.body = "Answer body is required.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      questionId,
      body,
      expertDisplayName,
      expertServiceLabel,
      expertProfileSlug
    }
  };
}
