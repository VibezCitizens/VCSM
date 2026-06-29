// src/features/profiles/kinds/vport/controller/content/listVportContentPages.controller.js
// Owner use-case: list all content pages (draft + published) for the active vport actor.

import listVportContentPagesDAL from "@/features/profiles/kinds/vport/dal/content/listVportContentPages.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

export async function listVportContentPagesController({ actorId, callerActorId } = {}) {
  if (!actorId) throw new Error("listVportContentPagesController: actorId is required");
  if (!callerActorId) throw new Error("listVportContentPagesController: callerActorId is required");

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

  const rows = await listVportContentPagesDAL({ actorId });
  return VportContentPageModel.fromRows(rows);
}

export default listVportContentPagesController;
