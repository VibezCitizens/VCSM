import { requestQuestionRemoval as requestQuestionRemovalRow } from "@/features/answers/dal/requestQuestionRemoval.write.dal";

// Orchestrates the question-removal REQUEST. Client-side validation here only
// guards empty/obviously-malformed input for UX — it never reveals whether the
// email matches a question. Any well-formed request returns the SAME generic
// "requested" status regardless of match, so match/no-match is never disclosed.
function looksLikeEmail(value) {
  return typeof value === "string" && /.+@.+\..+/.test(value.trim());
}

export async function requestQuestionRemoval(input = {}) {
  const slug = String(input.slug ?? "").trim();
  const email = String(input.email ?? "").trim();

  if (!slug) {
    return { ok: false, status: "invalid", errors: { form: "Missing question reference." } };
  }
  if (!looksLikeEmail(email)) {
    return { ok: false, status: "invalid", errors: { email: "Enter the email you used to submit." } };
  }

  // Fire the request. We do not branch on the result: success or transport
  // failure both resolve to the generic "requested" state (non-disclosure).
  await requestQuestionRemovalRow({ slug, email });

  return { ok: true, status: "requested", errors: {} };
}
