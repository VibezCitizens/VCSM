import { getSupabaseAdminClient } from "@/data/connectors/supabase.client";

const ANSWERS_SCHEMA_READY = process.env.TRAZE_ANSWERS_SCHEMA_READY === "true";

const QUESTION_PROJECTION = [
  "id",
  "slug",
  "title",
  "body",
  "status",
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

export async function listModerationQuestionRows({ limit = 50 } = {}) {
  const client = getAnswersAdminClient();
  if (!client) return { data: [], error: null };

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 100);
  const { data, error } = await client
    .schema("answers")
    .from("questions")
    .select(QUESTION_PROJECTION)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  return { data: data ?? [], error: error ?? null };
}

export async function updateQuestionModerationRow({ id, values }) {
  const client = getAnswersAdminClient();
  if (!client) return { data: null, error: new Error("Answers moderation is not enabled.") };

  const { data, error } = await client
    .schema("answers")
    .from("questions")
    .update(values)
    .eq("id", id)
    .select(QUESTION_PROJECTION)
    .single();

  return { data: data ?? null, error: error ?? null };
}
