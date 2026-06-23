import { normalizeSlug } from "@/lib/slugs";

const TITLE_MAX_LENGTH = 140;
const BODY_MAX_LENGTH = 1000;
const FIELD_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 254;

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanOptional(value, maxLength = FIELD_MAX_LENGTH) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

export function buildQuestionSubmission(input = {}) {
  const title = cleanText(input.title, TITLE_MAX_LENGTH);
  const body = cleanText(input.body, BODY_MAX_LENGTH);
  const serviceKey = cleanOptional(input.serviceKey, 80);
  const city = cleanOptional(input.city);
  const region = cleanOptional(input.region);
  const country = cleanOptional(input.country);
  // Optional follow-up metadata. Email is lowercased server-side by the RPC.
  const askerName = cleanOptional(input.askerName);
  const askerEmail = cleanOptional(input.askerEmail, EMAIL_MAX_LENGTH);
  const slugBase = normalizeSlug(title);
  const errors = {};

  if (!title) {
    errors.title = "Question title is required.";
  }

  if (!slugBase) {
    errors.title = "Question title must include readable words.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      title,
      body,
      serviceKey,
      city,
      region,
      country,
      askerName,
      askerEmail,
      slugBase
    }
  };
}
