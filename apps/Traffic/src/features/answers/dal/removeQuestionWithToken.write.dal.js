import { getAnswersAnonClient } from "@/data/connectors/answersAnonClient";

// Anonymous question removal — CONFIRM step.
//
// Possession of the emailed token IS the authorization. Calls the anon-granted
// SECURITY DEFINER RPC answers.remove_question_with_token, which validates the
// token (hash + 30-min expiry + single-use), archives the question (never hard
// deletes), and returns one of: 'removed' | 'expired' | 'invalid' | 'already_removed'.
export async function removeQuestionWithToken(token) {
  const client = getAnswersAnonClient();
  if (!client || !token) {
    return { data: null, error: new Error("Question removal is not available.") };
  }

  const { data, error } = await client
    .schema("answers")
    .rpc("remove_question_with_token", { p_token: token });

  if (error) {
    if (error.code === "42883" || String(error.message ?? "").includes("remove_question_with_token")) {
      return {
        data: null,
        error: new Error("Question removal RPC is missing. Apply the answers.remove_question_with_token migration.")
      };
    }
    return { data: null, error };
  }

  // Scalar-returning RPC: supabase-js yields the value directly (or an array).
  const value = Array.isArray(data) ? data[0] : data;
  return { data: value ?? null, error: null };
}
