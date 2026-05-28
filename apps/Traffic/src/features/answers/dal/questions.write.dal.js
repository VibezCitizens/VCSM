import { getSupabaseClient } from "@/data/connectors/supabase.client";

const ANSWERS_SCHEMA_READY = process.env.TRAZE_ANSWERS_SCHEMA_READY === "true";

const QUESTION_WRITE_RETURN_PROJECTION = [
  "id",
  "slug",
  "status",
  "moderation_status",
  "created_at"
].join(",");

function getAnswersClient() {
  if (!ANSWERS_SCHEMA_READY) return null;
  return getSupabaseClient();
}

export async function createQuestionRow(input) {
  const client = getAnswersClient();
  if (!client) {
    return { data: null, error: new Error("Answers schema is not enabled.") };
  }

  const { data, error } = await client
    .schema("answers")
    .from("questions")
    .insert({
      slug: input.slug,
      title: input.title,
      body: input.body,
      topic_id: null,
      service_key: input.serviceKey,
      city: input.city,
      region: input.region,
      country: input.country,
      status: "draft",
      is_published: false,
      is_moderated: false,
      moderation_status: "pending"
    })
    .select(QUESTION_WRITE_RETURN_PROJECTION)
    .single();

  return { data: data ?? null, error: error ?? null };
}
