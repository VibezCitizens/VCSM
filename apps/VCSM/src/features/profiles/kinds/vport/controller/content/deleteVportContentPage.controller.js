// src/features/profiles/kinds/vport/controller/content/deleteVportContentPage.controller.js

import readVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/readVportContentPage.dal";
import deleteVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

export async function deleteVportContentPageController({ actorId, callerActorId, id } = {}) {
  if (!actorId) throw new Error("deleteVportContentPageController: actorId is required");
  if (!callerActorId) throw new Error("deleteVportContentPageController: callerActorId is required");
  if (!id) throw new Error("deleteVportContentPageController: id is required");

  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });

  const existing = await readVportContentPageDAL({ id });
  if (!existing) throw new Error("Content page not found.");
  if (existing.actor_id !== actorId) throw new Error("Not allowed to delete this content page.");

  return await deleteVportContentPageDAL({ id });
}

export default deleteVportContentPageController;
