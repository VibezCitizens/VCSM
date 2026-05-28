// src/features/profiles/kinds/vport/controller/content/createVportContentPage.controller.js

import createVportContentPageDAL, { readContentPageSlugsByPrefixDAL } from "@/features/profiles/kinds/vport/dal/content/createVportContentPage.dal";
import VportContentPageModel from "@/features/profiles/kinds/vport/model/content/VportContentPage.model";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

const VALID_CATEGORIES = ["guide", "faq", "emergency", "tips", "educational"];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

async function resolveUniqueSlug(actorId, baseSlug) {
  const slugs = await readContentPageSlugsByPrefixDAL({ actorId, slugPrefix: baseSlug });
  const existing = new Set(slugs);
  if (!existing.has(baseSlug)) return baseSlug;

  for (let i = 2; i <= 20; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

export async function createVportContentPageController({
  actorId,
  callerActorId,
  title,
  excerpt = null,
  body = null,
  category = null,
  serviceKeys = [],
} = {}) {
  if (!actorId) throw new Error("createVportContentPageController: actorId is required");
  if (!callerActorId) throw new Error("createVportContentPageController: callerActorId is required");
  if (!title?.trim()) throw new Error("Title is required.");

  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });

  const baseSlug = slugify(title.trim());
  if (!baseSlug) throw new Error("Could not generate a valid slug from this title. Please use letters or numbers.");

  const slug = await resolveUniqueSlug(actorId, baseSlug);

  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  const row = await createVportContentPageDAL({
    actorId,
    title: title.trim(),
    slug,
    excerpt: excerpt?.trim() || null,
    body: body?.trim() || null,
    category: category || null,
    serviceKeys: Array.isArray(serviceKeys) ? serviceKeys : [],
  });

  return VportContentPageModel.fromRow(row);
}

export default createVportContentPageController;
