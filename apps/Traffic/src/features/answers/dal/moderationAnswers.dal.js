import { getSupabaseAdminClient } from "@/data/connectors/supabase.client";

const ANSWERS_SCHEMA_READY = process.env.TRAZE_ANSWERS_SCHEMA_READY === "true";

const ANSWER_PROJECTION = [
  "id",
  "question_id",
  "expert_display_name",
  "expert_profile_slug",
  "expert_service_label",
  "body",
  "status",
  "is_accepted",
  "is_published",
  "is_moderated",
  "moderation_status",
  "moderation_note",
  "created_at",
  "updated_at"
].join(",");

function getAnswersAdminClient() {
  if (!ANSWERS_SCHEMA_READY) return null;
  return getSupabaseAdminClient();
}

export async function listModerationAnswerRowsByQuestionIds(questionIds = []) {
  const client = getAnswersAdminClient();
  if (!client || questionIds.length === 0) return { data: [], error: null };

  const { data, error } = await client
    .schema("answers")
    .from("answers")
    .select(ANSWER_PROJECTION)
    .in("question_id", questionIds)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error ?? null };
}

export async function createModerationAnswerRow(input) {
  const client = getAnswersAdminClient();
  if (!client) return { data: null, error: new Error("Answers moderation is not enabled.") };

  const { data, error } = await client
    .schema("answers")
    .from("answers")
    .insert({
      question_id: input.questionId,
      expert_display_name: input.expertDisplayName,
      expert_profile_slug: input.expertProfileSlug,
      expert_service_label: input.expertServiceLabel,
      body: input.body,
      status: "draft",
      is_accepted: false,
      is_published: false,
      is_moderated: false,
      moderation_status: "pending"
    })
    .select(ANSWER_PROJECTION)
    .single();

  return { data: data ?? null, error: error ?? null };
}

export async function updateAnswerModerationRow({ id, values }) {
  const client = getAnswersAdminClient();
  if (!client) return { data: null, error: new Error("Answers moderation is not enabled.") };

  const { data, error } = await client
    .schema("answers")
    .from("answers")
    .update(values)
    .eq("id", id)
    .select(ANSWER_PROJECTION)
    .single();

  return { data: data ?? null, error: error ?? null };
}
