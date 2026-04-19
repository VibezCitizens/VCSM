// src/features/profiles/kinds/vport/controller/content/readVportPublicContentPage.controller.js
// Public use-case: read a single published content page by id (includes body for viewer).

import readVportPublicContentPageDAL from "@/features/profiles/kinds/vport/dal/content/readVportPublicContentPage.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";

export async function readVportPublicContentPageController({ id } = {}) {
  if (!id) throw new Error("readVportPublicContentPageController: id is required");

  const row = await readVportPublicContentPageDAL({ id });
  if (!row) return null;
  return VportContentPageModel.fromRow(row);
}

export default readVportPublicContentPageController;
