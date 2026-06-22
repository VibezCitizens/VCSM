// src/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal.js

import vportSchema from "@/services/supabase/vportClient";

const CONTENT_SELECT =
  "id,title,slug,excerpt,body,category,service_keys,is_published,is_indexable,published_at,created_at,updated_at";

// Immutable and privilege-sensitive fields must never be accepted via this path.
// is_published is managed exclusively by toggleVportContentPagePublishDAL.
const ALLOWED_UPDATE_FIELDS = new Set([
  "title",
  "excerpt",
  "body",
  "category",
  "service_keys",
]);

export async function updateVportContentPageDAL({ id, actorId, patch } = {}) {
  if (!id) throw new Error("updateVportContentPageDAL: id is required");
  if (!actorId) throw new Error("updateVportContentPageDAL: actorId is required");
  if (!patch || typeof patch !== "object") {
    throw new Error("updateVportContentPageDAL: patch is required");
  }

  const safePatch = Object.fromEntries(
    Object.entries(patch).filter(([k]) => ALLOWED_UPDATE_FIELDS.has(k))
  );

  if (!Object.keys(safePatch).length) {
    throw new Error("updateVportContentPageDAL: no valid fields in patch");
  }

  const { data, error } = await vportSchema
    .from("content_pages")
    .update(safePatch)
    .eq("id", id)
    .eq("actor_id", actorId)
    .select(CONTENT_SELECT)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("updateVportContentPageDAL: content page not found or not owned by actor");
  return data;
}

export default updateVportContentPageDAL;
