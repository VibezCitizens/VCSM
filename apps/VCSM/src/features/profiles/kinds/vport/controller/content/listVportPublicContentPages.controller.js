// src/features/profiles/kinds/vport/controller/content/listVportPublicContentPages.controller.js
// Public use-case: list published content pages visible to any viewer.

import listVportPublicContentPagesDAL from "@/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";

export async function listVportPublicContentPagesController({ actorId } = {}) {
  if (!actorId) throw new Error("listVportPublicContentPagesController: actorId is required");

  const rows = await listVportPublicContentPagesDAL({ actorId });
  return VportContentPageModel.fromRows(rows);
}

export default listVportPublicContentPagesController;
