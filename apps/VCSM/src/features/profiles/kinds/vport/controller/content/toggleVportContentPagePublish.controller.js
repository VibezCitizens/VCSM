// src/features/profiles/kinds/vport/controller/content/toggleVportContentPagePublish.controller.js

import readVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/readVportContentPage.dal";
import toggleVportContentPagePublishDAL from "@/features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";
import { invalidateVportPublicContentCache } from "@/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal";

export async function toggleVportContentPagePublishController({ actorId, id, isPublished } = {}) {
  if (!actorId) throw new Error("toggleVportContentPagePublishController: actorId is required");
  if (!id) throw new Error("toggleVportContentPagePublishController: id is required");
  if (typeof isPublished !== "boolean") {
    throw new Error("isPublished must be a boolean.");
  }

  const existing = await readVportContentPageDAL({ id });
  if (!existing) throw new Error("Content page not found.");
  if (existing.actor_id !== actorId) throw new Error("Not allowed to modify this content page.");

  const updated = await toggleVportContentPagePublishDAL({ id, isPublished });
  invalidateVportPublicContentCache(actorId);
  return VportContentPageModel.fromRow(updated);
}

export default toggleVportContentPagePublishController;
