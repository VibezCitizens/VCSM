// src/features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal.js

import vportSchema from "@/services/supabase/vportClient";

export async function deleteVportContentPageDAL({ id, actorId } = {}) {
  if (!id) throw new Error("deleteVportContentPageDAL: id is required");
  if (!actorId) throw new Error("deleteVportContentPageDAL: actorId is required");

  const { error } = await vportSchema
    .from("content_pages")
    .delete()
    .eq("id", id)
    .eq("actor_id", actorId);

  if (error) throw error;
  return { id };
}

export default deleteVportContentPageDAL;
