const NAME_MAX_LENGTH = 120;
const LABEL_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 254;
const BODY_MAX_LENGTH = 4000;

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanMultiline(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function cleanOptional(value, maxLength) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

export function buildAnswerSubmission(input = {}) {
  const expertDisplayName = cleanText(input.expertDisplayName, NAME_MAX_LENGTH);
  const expertProfileSlug = cleanOptional(input.expertProfileSlug, LABEL_MAX_LENGTH);
  const contactEmail = cleanOptional(input.contactEmail, EMAIL_MAX_LENGTH);
  const body = cleanMultiline(input.body, BODY_MAX_LENGTH);
  const errors = {};

  if (!expertDisplayName) {
    errors.expertDisplayName = "Your name is required.";
  }
  if (!body) {
    errors.body = "An answer is required.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      expertDisplayName,
      expertProfileSlug,
      expertServiceLabel: null,
      contactEmail,
      body
    }
  };
}
