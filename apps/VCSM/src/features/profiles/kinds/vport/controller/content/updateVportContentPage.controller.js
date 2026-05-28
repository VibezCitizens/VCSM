// src/features/profiles/kinds/vport/controller/content/updateVportContentPage.controller.js
// Slug is intentionally excluded from the patch — slugs are immutable after creation.

import readVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/readVportContentPage.dal";
import updateVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

const VALID_CATEGORIES = ["guide", "faq", "emergency", "tips", "educational"];

export async function updateVportContentPageController({
  actorId,
  callerActorId,
  id,
  title,
  excerpt,
  body,
  category,
  serviceKeys,
} = {}) {
  if (!actorId) throw new Error("updateVportContentPageController: actorId is required");
  if (!callerActorId) throw new Error("updateVportContentPageController: callerActorId is required");
  if (!id) throw new Error("updateVportContentPageController: id is required");

  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });

  const existing = await readVportContentPageDAL({ id });
  if (!existing) throw new Error("Content page not found.");
  if (existing.actor_id !== actorId) throw new Error("Not allowed to modify this content page.");

  const patch = {};

  if (title !== undefined) {
    if (!title?.trim()) throw new Error("Title is required.");
    patch.title = title.trim();
  }

  if (excerpt !== undefined) patch.excerpt = excerpt?.trim() || null;
  if (body !== undefined) patch.body = body?.trim() || null;

  if (category !== undefined) {
    if (category && !VALID_CATEGORIES.includes(category)) {
      throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
    patch.category = category || null;
  }

  if (serviceKeys !== undefined) {
    patch.service_keys = Array.isArray(serviceKeys) ? serviceKeys : [];
  }

  if (!Object.keys(patch).length) {
    return VportContentPageModel.fromRow(existing);
  }

  const updated = await updateVportContentPageDAL({ id, actorId, patch });
  return VportContentPageModel.fromRow(updated);
}

export default updateVportContentPageController;
