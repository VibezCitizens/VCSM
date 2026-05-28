import { getSupabaseClient } from "@/data/connectors/supabase.client";

const ANSWERS_SCHEMA_READY = process.env.TRAZE_ANSWERS_SCHEMA_READY === "true";

const PUBLIC_ANSWER_PAGE_PROJECTION = [
  "question_id",
  "slug",
  "title",
  "question_body",
  "topic_id",
  "topic_slug",
  "topic_name",
  "service_key",
  "city",
  "region",
  "country",
  "asked_at",
  "question_published_at",
  "question_updated_at",
  "answer_id",
  "expert_actor_id",
  "expert_display_name",
  "expert_profile_slug",
  "expert_service_label",
  "answer_body",
  "answered_at",
  "answer_published_at",
  "answer_updated_at"
].join(",");

const PUBLIC_ANSWER_SLUG_PROJECTION = "slug";

const PUBLIC_ANSWER_CANDIDATE_PROJECTION = [
  "slug",
  "answer_updated_at",
  "question_updated_at",
  "answer_published_at",
  "question_published_at"
].join(",");

function getAnswersClient() {
  if (!ANSWERS_SCHEMA_READY) return null;
  return getSupabaseClient();
}

export async function readPublicAnswerPageRowsBySlug({ slug }) {
  const client = getAnswersClient();
  if (!client || !slug) return [];

  const { data, error } = await client
    .schema("answers")
    .from("public_answer_pages")
    .select(PUBLIC_ANSWER_PAGE_PROJECTION)
    .eq("slug", slug)
    .order("answer_published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listPublicAnswerPageRows({ limit = 20 } = {}) {
  const client = getAnswersClient();
  if (!client) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 50);
  const { data, error } = await client
    .schema("answers")
    .from("public_answer_pages")
    .select(PUBLIC_ANSWER_PAGE_PROJECTION)
    .order("question_updated_at", { ascending: false })
    .order("answer_published_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return data ?? [];
}

export async function listPublicAnswerSlugRows({ limit = 1000 } = {}) {
  const client = getAnswersClient();
  if (!client) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 1000, 1), 5000);
  const { data, error } = await client
    .schema("answers")
    .from("public_answer_pages")
    .select(PUBLIC_ANSWER_SLUG_PROJECTION)
    .order("question_updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return data ?? [];
}

export async function listPublicAnswerCandidateRows({ limit = 5000 } = {}) {
  const client = getAnswersClient();
  if (!client) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 5000, 1), 10000);
  const { data, error } = await client
    .schema("answers")
    .from("public_answer_pages")
    .select(PUBLIC_ANSWER_CANDIDATE_PROJECTION)
    .order("answer_updated_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return data ?? [];
}
