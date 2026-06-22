// src/features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal.js

import vportSchema from "@/services/supabase/vportClient";

const PUBLISH_SELECT =
  "id,title,slug,is_published,is_indexable,published_at,updated_at";

export async function toggleVportContentPagePublishDAL({ id, actorId, isPublished } = {}) {
  if (!id) throw new Error("toggleVportContentPagePublishDAL: id is required");
  if (!actorId) throw new Error("toggleVportContentPagePublishDAL: actorId is required");
  if (typeof isPublished !== "boolean") {
    throw new Error("toggleVportContentPagePublishDAL: isPublished must be a boolean");
  }

  const patch = {
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
  };

  const { data, error } = await vportSchema
    .from("content_pages")
    .update(patch)
    .eq("id", id)
    .eq("actor_id", actorId)
    .select(PUBLISH_SELECT)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("toggleVportContentPagePublishDAL: content page not found or not owned by actor");
  return data;
}

export default toggleVportContentPagePublishDAL;
