import { removeQuestionWithToken as removeQuestionWithTokenRow } from "@/features/answers/dal/removeQuestionWithToken.write.dal";

const VALID_RESULTS = new Set(["removed", "expired", "invalid", "already_removed"]);

// Validates and normalizes the token-removal result. Maps anything unexpected to
// "invalid" so the UI never reveals more than the four defined states.
export async function removeQuestionWithToken(token) {
  const clean = String(token ?? "").trim();
  if (!clean) {
    return { ok: false, status: "invalid" };
  }

  const { data, error } = await removeQuestionWithTokenRow(clean);
  if (error) {
    return { ok: false, status: "error" };
  }

  const status = VALID_RESULTS.has(data) ? data : "invalid";
  return { ok: status === "removed", status };
}
