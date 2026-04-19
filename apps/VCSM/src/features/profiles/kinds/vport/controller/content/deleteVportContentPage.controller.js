// src/features/profiles/kinds/vport/controller/content/deleteVportContentPage.controller.js

import readVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/readVportContentPage.dal";
import deleteVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal";

export async function deleteVportContentPageController({ actorId, id } = {}) {
  if (!actorId) throw new Error("deleteVportContentPageController: actorId is required");
  if (!id) throw new Error("deleteVportContentPageController: id is required");

  const existing = await readVportContentPageDAL({ id });
  if (!existing) throw new Error("Content page not found.");
  if (existing.actor_id !== actorId) throw new Error("Not allowed to delete this content page.");

  return await deleteVportContentPageDAL({ id });
}

export default deleteVportContentPageController;
