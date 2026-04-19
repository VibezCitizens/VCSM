// src/features/profiles/kinds/vport/dal/content/readVportContentPage.dal.js
// Internal read — full row including body. Used by controllers for ownership checks.

import vportSchema from "@/services/supabase/vportClient";

const CONTENT_SELECT =
  "id,actor_id,profile_id,title,slug,excerpt,body,category,service_keys,is_published,is_indexable,published_at,created_at,updated_at";

export async function readVportContentPageDAL({ id } = {}) {
  if (!id) throw new Error("readVportContentPageDAL: id is required");

  const { data, error } = await vportSchema
    .from("content_pages")
    .select(CONTENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default readVportContentPageDAL;
