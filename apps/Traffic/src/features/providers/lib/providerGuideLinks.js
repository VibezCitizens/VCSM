import { getPublicContentPagesByProfileSlug } from "@/features/providers/dal/provider.read.dal";
import { contentGuideCanonicalPath } from "@/lib/paths";
import { normalizeSlug } from "@/lib/slugs";

function getProviderProfileSlugCandidates(provider) {
  return [...new Set([
    normalizeSlug(provider?.vcsmSlug),
    normalizeSlug(provider?.slug)
  ].filter(Boolean))];
}

function normalizeTimestamp(value) {
  const timestamp = Date.parse(value ?? "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function buildGuideDescription(page) {
  if (page.excerpt) {
    return page.excerpt;
  }

  const parts = [page.category, page.locationText].filter(Boolean);
  return parts.join(" · ") || "Guide and resource";
}

export async function getProviderGuideLinks(provider, options = {}) {
  const limit = Number(options.limit ?? 4);
  const clampedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 8) : 4;

  const profileSlugCandidates = getProviderProfileSlugCandidates(provider);
  if (!profileSlugCandidates.length) {
    return [];
  }

  const queryLimit = clampedLimit * 3;
  const buckets = await Promise.all(
    profileSlugCandidates.map((profileSlug) =>
      getPublicContentPagesByProfileSlug(profileSlug, { limit: queryLimit })
    )
  );

  const byGuideKey = new Map();
  for (const page of buckets.flat()) {
    if (!page?.slug || !page?.profileSlug) {
      continue;
    }

    const key = `${page.profileSlug}::${page.slug}`;
    const existing = byGuideKey.get(key);

    if (!existing) {
      byGuideKey.set(key, page);
      continue;
    }

    const existingUpdated = normalizeTimestamp(existing.updatedAt ?? existing.publishedAt ?? existing.createdAt);
    const candidateUpdated = normalizeTimestamp(page.updatedAt ?? page.publishedAt ?? page.createdAt);

    if (candidateUpdated > existingUpdated) {
      byGuideKey.set(key, page);
    }
  }

  return [...byGuideKey.values()]
    .sort((left, right) => {
      const rightUpdated = normalizeTimestamp(right.updatedAt ?? right.publishedAt ?? right.createdAt);
      const leftUpdated = normalizeTimestamp(left.updatedAt ?? left.publishedAt ?? left.createdAt);

      if (rightUpdated !== leftUpdated) {
        return rightUpdated - leftUpdated;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, clampedLimit)
    .map((page) => ({
      label: page.title,
      href: contentGuideCanonicalPath(page.profileSlug, page.slug),
      description: buildGuideDescription(page)
    }));
}
