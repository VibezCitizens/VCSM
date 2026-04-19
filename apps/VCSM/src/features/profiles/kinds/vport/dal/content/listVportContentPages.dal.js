// src/features/profiles/kinds/vport/dal/content/listVportContentPages.dal.js
// Owner DAL — returns all pages (draft + published) for a vport actor

import vportSchema from "@/services/supabase/vportClient";

const CONTENT_SELECT =
  "id,actor_id,profile_id,title,slug,excerpt,category,service_keys,is_published,is_indexable,published_at,created_at,updated_at";

export async function listVportContentPagesDAL({ actorId } = {}) {
  if (!actorId) throw new Error("listVportContentPagesDAL: actorId is required");

  const { data, error } = await vportSchema
    .from("content_pages")
    .select(CONTENT_SELECT)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export default listVportContentPagesDAL;
