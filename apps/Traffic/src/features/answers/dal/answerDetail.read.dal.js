import { getAnswersAnonClient } from "@/data/connectors/answersAnonClient";

// Public detail reads. Both RPCs return only public fields (no asker_email,
// moderation_note, or moderated_by_actor_id). Resolve gracefully (never throw)
// so detail pages degrade instead of crashing.

function isMissingRpc(error, fnName) {
  return error?.code === "42883" || String(error?.message ?? "").includes(fnName);
}

export async function getPublishedQuestion(slug) {
  const client = getAnswersAnonClient();
  if (!client || !slug) {
    return { data: null, error: new Error("Answers reads are not available.") };
  }

  const { data, error } = await client.schema("answers").rpc("get_published_question", { p_slug: slug });
  if (error) {
    return { data: null, error, missing: isMissingRpc(error, "get_published_question") };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { data: row ?? null, error: null };
}

export async function listPublishedAnswersForQuestion(slug) {
  const client = getAnswersAnonClient();
  if (!client || !slug) {
    return { data: [], error: new Error("Answers reads are not available.") };
  }

  const { data, error } = await client
    .schema("answers")
    .rpc("list_published_answers_for_question", { p_question_slug: slug });
  if (error) {
    return { data: [], error, missing: isMissingRpc(error, "list_published_answers_for_question") };
  }

  return { data: data ?? [], error: null };
}
