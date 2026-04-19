// src/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal.js

import vportSchema from "@/services/supabase/vportClient";

const CONTENT_SELECT =
  "id,actor_id,profile_id,title,slug,excerpt,body,category,service_keys,is_published,is_indexable,published_at,created_at,updated_at";

export async function updateVportContentPageDAL({ id, patch } = {}) {
  if (!id) throw new Error("updateVportContentPageDAL: id is required");
  if (!patch || typeof patch !== "object") {
    throw new Error("updateVportContentPageDAL: patch is required");
  }

  const { data, error } = await vportSchema
    .from("content_pages")
    .update(patch)
    .eq("id", id)
    .select(CONTENT_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export default updateVportContentPageDAL;
