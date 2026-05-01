import { getSupabaseClient } from "@/data/connectors/supabase.client";

const ANSWERS_SCHEMA_READY = process.env.TRAZE_ANSWERS_SCHEMA_READY === "true";

const ANSWER_PROJECTION = [
  "id",
  "question_id",
  "expert_actor_id",
  "expert_display_name",
  "expert_profile_slug",
  "expert_service_label",
  "body",
  "status",
  "is_accepted",
  "is_published",
  "answered_at",
  "published_at",
  "created_at",
  "updated_at"
].join(",");

function getAnswersClient() {
  if (!ANSWERS_SCHEMA_READY) return null;
  return getSupabaseClient();
}

export async function readAnswerRowsByQuestionId({ questionId }) {
  const client = getAnswersClient();
  if (!client || !questionId) return [];

  const { data, error } = await client
    .schema("answers")
    .from("answers")
    .select(ANSWER_PROJECTION)
    .eq("question_id", questionId)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listAnswerRowsByQuestionIds({ questionIds }) {
  const client = getAnswersClient();
  const ids = Array.isArray(questionIds) ? questionIds.filter(Boolean) : [];
  if (!client || ids.length === 0) return [];

  const { data, error } = await client
    .schema("answers")
    .from("answers")
    .select(ANSWER_PROJECTION)
    .in("question_id", ids)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
