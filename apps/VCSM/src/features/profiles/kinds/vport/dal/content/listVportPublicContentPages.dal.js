// src/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal.js
// Public DAL — returns only published pages for a vport actor

import vportSchema from "@/services/supabase/vportClient";

const PUBLIC_SELECT =
  "id,actor_id,profile_id,title,slug,excerpt,category,service_keys,published_at,created_at";

export async function listVportPublicContentPagesDAL({ actorId } = {}) {
  if (!actorId) throw new Error("listVportPublicContentPagesDAL: actorId is required");

  const { data, error } = await vportSchema
    .from("content_pages")
    .select(PUBLIC_SELECT)
    .eq("actor_id", actorId)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export default listVportPublicContentPagesDAL;
