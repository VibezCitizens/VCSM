import { getSupabaseClient } from "@/data/connectors/supabase.client";

const ANSWERS_SCHEMA_READY = process.env.TRAZE_ANSWERS_SCHEMA_READY === "true";

const PUBLIC_TOPIC_PROJECTION = [
  "id",
  "slug",
  "name",
  "description",
  "parent_id",
  "sort_order",
  "updated_at"
].join(",");

function getAnswersClient() {
  if (!ANSWERS_SCHEMA_READY) return null;
  return getSupabaseClient();
}

export async function listPublicTopicRows({ limit = 24 } = {}) {
  const client = getAnswersClient();
  if (!client) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 24, 1), 50);
  const { data, error } = await client
    .schema("answers")
    .from("public_topics")
    .select(PUBLIC_TOPIC_PROJECTION)
    .order("sort_order", { ascending: true })
    .limit(safeLimit);

  if (error) throw error;
  return data ?? [];
}
