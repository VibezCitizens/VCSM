import {
  fetchPublicContentPageByProfileAndSlug,
  fetchPublicContentPageBySlug,
  fetchPublicContentPages,
  fetchPublicContentSlugs
} from "@/data/connectors/publicContent.connector";
import { normalizeSlug } from "@/lib/slugs";

function normalizeTimestamp(value) {
  const timestamp = Date.parse(value ?? "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function tokenizeLocation(value) {
  return String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9-]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function contentSort(left, right) {
  const leftTime = normalizeTimestamp(left.publishedAt ?? left.updatedAt ?? left.createdAt);
  const rightTime = normalizeTimestamp(right.publishedAt ?? right.updatedAt ?? right.createdAt);

  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  return left.title.localeCompare(right.title);
}

function withLimit(items, limit) {
  const numericLimit = Number(limit ?? 0);
  if (Number.isFinite(numericLimit) && numericLimit > 0) {
    return items.slice(0, Math.floor(numericLimit));
  }

  return items;
}

async function readPublicContentPages(filters = {}) {
  const pages = await fetchPublicContentPages(filters).catch(() => []);
  return pages
    .filter((page) => Boolean(page && page.isPublished && page.isIndexable && page.slug))
    .sort(contentSort);
}

function matchesCategory(page, category) {
  if (!category) {
    return true;
  }

  return page.category === String(category).trim().toLowerCase();
}

function matchesProfile(page, profileSlug) {
  if (!profileSlug) {
    return true;
  }

  const normalizedProfileSlug = normalizeSlug(profileSlug);
  if (!normalizedProfileSlug) {
    return true;
  }

  return normalizeSlug(page.profileSlug) === normalizedProfileSlug;
}

function matchesService(page, serviceKey) {
  if (!serviceKey) {
    return true;
  }

  const normalizedKey = normalizeSlug(serviceKey);
  if (!normalizedKey) {
    return true;
  }

  return page.serviceKeys.includes(normalizedKey);
}

function matchesLocation(page, location) {
  if (!location) {
    return true;
  }

  const normalizedLocation = normalizeSlug(location);
  if (!normalizedLocation) {
    return true;
  }

  const locationTokens = new Set(
    [
      page.countrySlug,
      page.citySlug,
      page.localitySlug,
      page.profileSlug,
      page.countryCode,
      ...tokenizeLocation(page.locationRelevance),
      ...tokenizeLocation(page.locationText)
    ]
      .map((entry) => normalizeSlug(entry))
      .filter(Boolean)
  );

  return locationTokens.has(normalizedLocation);
}

function filterPages(pages, filters = {}) {
  const filtered = pages.filter(
    (page) =>
      matchesProfile(page, filters.profileSlug) &&
      matchesCategory(page, filters.category) &&
      matchesService(page, filters.serviceKey) &&
      matchesLocation(page, filters.location)
  );

  return withLimit(filtered, filters.limit);
}

export async function getAllPublicContentPages(filters = {}) {
  const pages = await readPublicContentPages(filters);
  return filterPages(pages, filters);
}

export async function getPublicContentPageBySlug(slug, options = {}) {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  if (options.profileSlug) {
    return getPublicContentPageByProfileAndSlug(options.profileSlug, normalizedSlug);
  }

  const pages = await readPublicContentPages({
    contentSlug: normalizedSlug,
    limit: 25,
    cacheTags: [`guide:${normalizedSlug}`]
  });
  const fromCache = pages.find((page) => page.slug === normalizedSlug) ?? null;
  if (fromCache) {
    return fromCache;
  }

  return fetchPublicContentPageBySlug(normalizedSlug);
}

export async function getPublicContentPageByProfileAndSlug(profileSlug, contentSlug) {
  const normalizedProfileSlug = normalizeSlug(profileSlug);
  const normalizedContentSlug = normalizeSlug(contentSlug);

  if (!normalizedProfileSlug || !normalizedContentSlug) {
    return null;
  }

  const pages = await readPublicContentPages({
    profileSlug: normalizedProfileSlug,
    contentSlug: normalizedContentSlug,
    limit: 25,
    cacheTags: [`provider:${normalizedProfileSlug}`, `guide:${normalizedContentSlug}`]
  });
  const fromCache =
    pages.find(
      (page) => page.profileSlug === normalizedProfileSlug && page.slug === normalizedContentSlug
    ) ?? null;

  if (fromCache) {
    return fromCache;
  }

  return fetchPublicContentPageByProfileAndSlug(normalizedProfileSlug, normalizedContentSlug);
}

export async function getPublicContentPagesByService(serviceKey, options = {}) {
  return getAllPublicContentPages({
    ...options,
    serviceKey
  });
}

export async function getPublicContentPagesByProfileSlug(profileSlug, options = {}) {
  return getAllPublicContentPages({
    ...options,
    profileSlug
  });
}

export async function getPublicContentPagesByLocation(location, options = {}) {
  return getAllPublicContentPages({
    ...options,
    location
  });
}

export async function getHomepageGuidePreviewPages(options = {}) {
  const limit = options.limit ?? 3;

  return getAllPublicContentPages({
    ...options,
    category: "guide",
    limit
  });
}

export async function getAllPublicContentSlugsForStaticGeneration() {
  const pages = await readPublicContentPages();
  const slugs = [...new Set(pages.map((page) => page.slug).filter(Boolean))];

  if (slugs.length) {
    return slugs;
  }

  return fetchPublicContentSlugs();
}

export async function getAllPublicContentGuideParamsForStaticGeneration() {
  const pages = await readPublicContentPages();
  const seen = new Set();
  const params = [];

  for (const page of pages) {
    if (!page.slug || !page.profileSlug) {
      continue;
    }

    const key = `${page.profileSlug}::${page.slug}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    params.push({
      profileSlug: page.profileSlug,
      contentSlug: page.slug
    });
  }

  return params;
}

// Backward-compatible aliases for existing routes and templates.
export async function listPublicContentPages(filters = {}) {
  return getAllPublicContentPages(filters);
}

export async function listPublicContentPagesByService(serviceKey, options = {}) {
  return getPublicContentPagesByService(serviceKey, options);
}

export async function listPublicContentPagesByProfileSlug(profileSlug, options = {}) {
  return getPublicContentPagesByProfileSlug(profileSlug, options);
}

export async function listPublicContentPagesByLocation(location, options = {}) {
  return getPublicContentPagesByLocation(location, options);
}

export async function listPublicContentSlugs() {
  return getAllPublicContentSlugsForStaticGeneration();
}
