// src/features/profiles/kinds/vport/controller/content/listVportContentPages.controller.js
// Owner use-case: list all content pages (draft + published) for the active vport actor.

import listVportContentPagesDAL from "@/features/profiles/kinds/vport/dal/content/listVportContentPages.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";

export async function listVportContentPagesController({ actorId, callerActorId } = {}) {
  if (!actorId) throw new Error("listVportContentPagesController: actorId is required");
  if (!callerActorId) throw new Error("listVportContentPagesController: callerActorId is required");

  if (String(callerActorId) !== String(actorId)) {
    throw new Error("Only the actor owner can manage this content.");
  }

  const rows = await listVportContentPagesDAL({ actorId });
  return VportContentPageModel.fromRows(rows);
}

export default listVportContentPagesController;
