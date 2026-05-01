import { getSupabaseClient } from "@/data/connectors/supabase.client";

const ANSWERS_SCHEMA_READY = process.env.TRAZE_ANSWERS_SCHEMA_READY === "true";

const TOPIC_PROJECTION = [
  "id",
  "slug",
  "name",
  "description",
  "parent_id",
  "is_active",
  "sort_order",
  "created_at",
  "updated_at"
].join(",");

function getAnswersClient() {
  if (!ANSWERS_SCHEMA_READY) return null;
  return getSupabaseClient();
}

export async function readTopicRowsByIds({ topicIds }) {
  const client = getAnswersClient();
  const ids = Array.isArray(topicIds) ? topicIds.filter(Boolean) : [];
  if (!client || ids.length === 0) return [];

  const { data, error } = await client
    .schema("answers")
    .from("topics")
    .select(TOPIC_PROJECTION)
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}

export async function listTopicRows({ limit = 24 } = {}) {
  const client = getAnswersClient();
  if (!client) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 24, 1), 50);
  const { data, error } = await client
    .schema("answers")
    .from("topics")
    .select(TOPIC_PROJECTION)
    .order("sort_order", { ascending: true })
    .limit(safeLimit);

  if (error) throw error;
  return data ?? [];
}
