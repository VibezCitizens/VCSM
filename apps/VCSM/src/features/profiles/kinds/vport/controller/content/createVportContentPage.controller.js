// src/features/profiles/kinds/vport/controller/content/createVportContentPage.controller.js

import createVportContentPageDAL from "@/features/profiles/kinds/vport/dal/content/createVportContentPage.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";

const VALID_CATEGORIES = ["guide", "faq", "emergency", "tips", "educational"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateSlug(slug) {
  if (!slug) return "Slug is required.";
  if (slug.length > 160) return "Slug must be 160 characters or fewer.";
  if (!SLUG_RE.test(slug)) return "Slug must be lowercase with hyphens only (e.g. my-guide).";
  return null;
}

export async function createVportContentPageController({
  actorId,
  title,
  slug,
  excerpt = null,
  body = null,
  category = null,
  serviceKeys = [],
} = {}) {
  if (!actorId) throw new Error("createVportContentPageController: actorId is required");
  if (!title?.trim()) throw new Error("Title is required.");

  const slugErr = validateSlug(slug);
  if (slugErr) throw new Error(slugErr);

  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  const row = await createVportContentPageDAL({
    actorId,
    title: title.trim(),
    slug: slug.trim(),
    excerpt: excerpt?.trim() || null,
    body: body?.trim() || null,
    category: category || null,
    serviceKeys: Array.isArray(serviceKeys) ? serviceKeys : [],
  });

  return VportContentPageModel.fromRow(row);
}

export default createVportContentPageController;
