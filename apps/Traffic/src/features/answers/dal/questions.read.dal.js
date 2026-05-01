import { getSupabaseClient } from "@/data/connectors/supabase.client";

const ANSWERS_SCHEMA_READY = process.env.TRAZE_ANSWERS_SCHEMA_READY === "true";

const QUESTION_PROJECTION = [
  "id",
  "slug",
  "title",
  "body",
  "topic_id",
  "service_key",
  "city",
  "region",
  "country",
  "status",
  "is_published",
  "is_moderated",
  "moderation_status",
  "asked_at",
  "published_at",
  "created_at",
  "updated_at"
].join(",");

function getAnswersClient() {
  if (!ANSWERS_SCHEMA_READY) return null;
  return getSupabaseClient();
}

export async function readQuestionRowBySlug({ slug }) {
  const client = getAnswersClient();
  if (!client || !slug) return null;

  const { data, error } = await client
    .schema("answers")
    .from("questions")
    .select(QUESTION_PROJECTION)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function listQuestionRows({ limit = 20 } = {}) {
  const client = getAnswersClient();
  if (!client) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 50);
  const { data, error } = await client
    .schema("answers")
    .from("questions")
    .select(QUESTION_PROJECTION)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return data ?? [];
}
