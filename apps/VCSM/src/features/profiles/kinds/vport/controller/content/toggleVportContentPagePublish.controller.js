// src/features/profiles/kinds/vport/controller/content/toggleVportContentPagePublish.controller.js

import toggleVportContentPagePublishDAL from "@/features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";
import { invalidateVportPublicContentCache } from "@/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

export async function toggleVportContentPagePublishController({ actorId, callerActorId, id, isPublished } = {}) {
  if (!actorId) throw new Error("toggleVportContentPagePublishController: actorId is required");
  if (!callerActorId) throw new Error("toggleVportContentPagePublishController: callerActorId is required");
  if (!id) throw new Error("toggleVportContentPagePublishController: id is required");
  if (typeof isPublished !== "boolean") {
    throw new Error("isPublished must be a boolean.");
  }

  // V05C1-M1: session-derived ownership of the target vport actor (replaces the
  // caller-equality self-grant). assertSessionOwnsActorController derives identity
  // from the session via vc.actor_owners; the error text is preserved on denial.
  try {
    await assertSessionOwnsActorController({
      targetActorId: actorId,
    });
  } catch {
    throw new Error("Only the actor owner can manage this content.");
  }

  const updated = await toggleVportContentPagePublishDAL({ id, actorId, isPublished });
  invalidateVportPublicContentCache(actorId);
  return VportContentPageModel.fromRow(updated);
}

export default toggleVportContentPagePublishController;
