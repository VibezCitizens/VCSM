// src/features/profiles/kinds/vport/controller/content/deleteVportContentPage.controller.js

import readVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/readVportContentPage.dal";
import deleteVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

export async function deleteVportContentPageController({ actorId, callerActorId, id } = {}) {
  if (!actorId) throw new Error("deleteVportContentPageController: actorId is required");
  if (!callerActorId) throw new Error("deleteVportContentPageController: callerActorId is required");
  if (!id) throw new Error("deleteVportContentPageController: id is required");

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

  const existing = await readVportContentPageDAL({ id });
  if (!existing) throw new Error("Content page not found.");
  if (existing.actor_id !== actorId) throw new Error("Not allowed to delete this content page.");

  return await deleteVportContentPageDAL({ id, actorId });
}

export default deleteVportContentPageController;
