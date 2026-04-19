// src/features/profiles/kinds/vport/dal/content/readVportPublicContentPage.dal.js
// Public read — full row including body. Only returns published pages.

import vportSchema from "@/services/supabase/vportClient";

const PUBLIC_FULL_SELECT =
  "id,actor_id,profile_id,title,slug,excerpt,body,category,service_keys,published_at,created_at";

export async function readVportPublicContentPageDAL({ id } = {}) {
  if (!id) throw new Error("readVportPublicContentPageDAL: id is required");

  const { data, error } = await vportSchema
    .from("content_pages")
    .select(PUBLIC_FULL_SELECT)
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default readVportPublicContentPageDAL;
