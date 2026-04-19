// src/features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal.js

import vportSchema from "@/services/supabase/vportClient";

export async function deleteVportContentPageDAL({ id } = {}) {
  if (!id) throw new Error("deleteVportContentPageDAL: id is required");

  const { error } = await vportSchema
    .from("content_pages")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return { id };
}

export default deleteVportContentPageDAL;
