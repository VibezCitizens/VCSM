import {
  getPublicContentPagesByLocation,
  getPublicContentPagesByService
} from "@/features/directories/dal/directory.read.dal";
import { contentGuideCanonicalPath, countryProviderPath } from "@/lib/paths";
import { normalizeSlug } from "@/lib/slugs";

function tokenizeLocation(value) {
  return String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9-]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeContext(context = {}) {
  return {
    serviceSlug: normalizeSlug(context.serviceSlug),
    localitySlug: normalizeSlug(context.localitySlug),
    citySlug: normalizeSlug(context.citySlug),
    countrySlug: normalizeSlug(context.countrySlug)
  };
}

function getLocationQueryTokens(context) {
  return [context.localitySlug, context.citySlug, context.countrySlug].filter(Boolean);
}

function pageMatchesLocation(page, locationSlug) {
  if (!locationSlug) {
    return false;
  }

  const locationTokens = new Set(
    [
      page.countrySlug,
      page.citySlug,
      page.localitySlug,
      page.locationRelevance,
      page.locationText
    ]
      .flatMap((value) => [normalizeSlug(value), ...tokenizeLocation(value)])
      .filter(Boolean)
  );

  return locationTokens.has(locationSlug);
}

function guideScore(page, context) {
  let score = 0;

  if (context.serviceSlug && page.serviceKeys.includes(context.serviceSlug)) {
    score += 4;
  }

  if (context.localitySlug && pageMatchesLocation(page, context.localitySlug)) {
    score += 3;
  }

  if (context.citySlug && pageMatchesLocation(page, context.citySlug)) {
    score += 2;
  }

  if (context.countrySlug && pageMatchesLocation(page, context.countrySlug)) {
    score += 1;
  }

  return score;
}

function normalizeTimestamp(value) {
  const timestamp = Date.parse(value ?? "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getLabelFromSlug(slug) {
  return String(slug ?? "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildGuideDescription(page) {
  const contextParts = [page.providerName, page.locationText].filter(Boolean);
  const contextSummary = contextParts.join(" · ");

  if (page.excerpt && contextSummary) {
    return `${page.excerpt} · ${contextSummary}`;
  }

  if (page.excerpt) {
    return page.excerpt;
  }

  return contextSummary || "Local service guide and resource.";
}

export async function getRelatedGuideLinksForContext(rawContext = {}, options = {}) {
  const context = normalizeContext(rawContext);
  const limit = Number(options.limit ?? 3);
  const clampedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 6) : 3;

  const locationTokens = getLocationQueryTokens(context);
  if (!context.serviceSlug && !locationTokens.length) {
    return [];
  }

  const querySize = clampedLimit * 4;
  const queryTasks = [];
  const directoryLocationKey = context.citySlug ?? context.localitySlug ?? context.countrySlug ?? null;
  const directoryTag =
    context.serviceSlug && directoryLocationKey
      ? `directory:${directoryLocationKey}:${context.serviceSlug}`
      : null;

  if (context.serviceSlug) {
    queryTasks.push(
      getPublicContentPagesByService(context.serviceSlug, {
        limit: querySize,
        ...(directoryTag ? { cacheTags: [directoryTag] } : {})
      })
    );
  }

  for (const locationToken of locationTokens) {
    queryTasks.push(
      getPublicContentPagesByLocation(locationToken, {
        limit: querySize,
        ...(context.serviceSlug
          ? { cacheTags: [`directory:${locationToken}:${context.serviceSlug}`] }
          : {})
      })
    );
  }

  const buckets = await Promise.all(queryTasks);
  const dedupedBySlug = new Map();

  for (const page of buckets.flat()) {
    if (!page?.slug) {
      continue;
    }

    const existing = dedupedBySlug.get(page.slug);
    if (!existing) {
      dedupedBySlug.set(page.slug, page);
      continue;
    }

    const existingUpdated = normalizeTimestamp(existing.updatedAt ?? existing.publishedAt ?? existing.createdAt);
    const candidateUpdated = normalizeTimestamp(page.updatedAt ?? page.publishedAt ?? page.createdAt);
    if (candidateUpdated > existingUpdated) {
      dedupedBySlug.set(page.slug, page);
    }
  }

  return [...dedupedBySlug.values()]
    .filter((page) => guideScore(page, context) > 0)
    .sort((left, right) => {
      const scoreDiff = guideScore(right, context) - guideScore(left, context);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const rightUpdated = normalizeTimestamp(right.updatedAt ?? right.publishedAt ?? right.createdAt);
      const leftUpdated = normalizeTimestamp(left.updatedAt ?? left.publishedAt ?? left.createdAt);
      if (rightUpdated !== leftUpdated) {
        return rightUpdated - leftUpdated;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, clampedLimit)
    .map((page) => {
      const providerCountrySlug = normalizeSlug(page.countrySlug ?? context.countrySlug);
      const providerSlug = normalizeSlug(page.providerSlug);
      const hasProviderLink = Boolean(providerCountrySlug && providerSlug);

      return {
        label: page.title,
        href: contentGuideCanonicalPath(page.profileSlug, page.slug),
        description: buildGuideDescription(page),
        secondaryHref: hasProviderLink
          ? countryProviderPath(providerCountrySlug, providerSlug)
          : null,
        secondaryLabel: hasProviderLink
          ? `View provider: ${page.providerName ?? getLabelFromSlug(providerSlug)}`
          : null
      };
    });
}
