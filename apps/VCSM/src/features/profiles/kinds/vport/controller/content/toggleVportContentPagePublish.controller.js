// src/features/profiles/kinds/vport/controller/content/toggleVportContentPagePublish.controller.js

import toggleVportContentPagePublishDAL from "@/features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";
import { invalidateVportPublicContentCache } from "@/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

export async function toggleVportContentPagePublishController({ actorId, callerActorId, id, isPublished } = {}) {
  if (!actorId) throw new Error("toggleVportContentPagePublishController: actorId is required");
  if (!callerActorId) throw new Error("toggleVportContentPagePublishController: callerActorId is required");
  if (!id) throw new Error("toggleVportContentPagePublishController: id is required");
  if (typeof isPublished !== "boolean") {
    throw new Error("isPublished must be a boolean.");
  }

  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });

  const updated = await toggleVportContentPagePublishDAL({ id, actorId, isPublished });
  invalidateVportPublicContentCache(actorId);
  return VportContentPageModel.fromRow(updated);
}

export default toggleVportContentPagePublishController;
