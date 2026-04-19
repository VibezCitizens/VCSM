// src/features/profiles/kinds/vport/controller/content/updateVportContentPage.controller.js

import readVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/readVportContentPage.dal";
import updateVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/updateVportContentPage.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";

const VALID_CATEGORIES = ["guide", "faq", "emergency", "tips", "educational"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateSlug(slug) {
  if (!slug) return "Slug is required.";
  if (slug.length > 160) return "Slug must be 160 characters or fewer.";
  if (!SLUG_RE.test(slug)) return "Slug must be lowercase with hyphens only (e.g. my-guide).";
  return null;
}

export async function updateVportContentPageController({
  actorId,
  id,
  title,
  slug,
  excerpt,
  body,
  category,
  serviceKeys,
} = {}) {
  if (!actorId) throw new Error("updateVportContentPageController: actorId is required");
  if (!id) throw new Error("updateVportContentPageController: id is required");

  const existing = await readVportContentPageDAL({ id });
  if (!existing) throw new Error("Content page not found.");
  if (existing.actor_id !== actorId) throw new Error("Not allowed to modify this content page.");

  const patch = {};

  if (title !== undefined) {
    if (!title?.trim()) throw new Error("Title is required.");
    patch.title = title.trim();
  }

  if (slug !== undefined) {
    const slugErr = validateSlug(slug);
    if (slugErr) throw new Error(slugErr);
    patch.slug = slug.trim();
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

  const updated = await updateVportContentPageDAL({ id, patch });
  return VportContentPageModel.fromRow(updated);
}

export default updateVportContentPageController;
