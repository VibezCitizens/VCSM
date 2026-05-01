import {
  CONTENT_TYPES,
  TRANSFORMATION_TERMS,
  normalizeString,
  normalizeKey,
  uniqueStrings,
  asObject,
  titleCase,
  normalizeExplicitContentType,
  formatDurationLabel,
  formatPriceLabel,
} from "@/features/profiles/kinds/vport/screens/portfolio/vportPortfolioUtils.model";

export function buildServiceSearchTerms(service) {
  const terms = [
    service?.label,
    service?.key,
    service?.category,
    ...(Array.isArray(service?.meta?.aliases) ? service.meta.aliases : []),
    ...(Array.isArray(service?.meta?.tags) ? service.meta.tags : []),
  ];

  return uniqueStrings(terms.map(normalizeKey));
}

export function buildPortfolioServices(services = [], serviceProfiles = []) {
  const serviceProfilesById = new Map();

  for (const profile of Array.isArray(serviceProfiles) ? serviceProfiles : []) {
    const id = normalizeString(profile?.serviceId);
    if (!id) continue;
    serviceProfilesById.set(id, profile);
  }

  return (Array.isArray(services) ? services : [])
    .filter((service) => service?.enabled !== false)
    .map((service) => {
      const serviceId = normalizeString(service?.id);
      const profile = serviceProfilesById.get(serviceId) ?? null;

      const durationMinutes =
        profile?.durationMinutes ??
        (Number.isFinite(Number(service?.meta?.durationMinutes))
          ? Number(service.meta.durationMinutes)
          : null);

      const priceCents =
        profile?.priceCents ??
        (Number.isFinite(Number(service?.meta?.priceCents))
          ? Number(service.meta.priceCents)
          : null);

      const currencyCode = normalizeString(profile?.currencyCode ?? service?.meta?.currencyCode ?? "USD");

      return {
        id: serviceId || null,
        key: normalizeString(service?.key) || null,
        label: normalizeString(service?.label) || titleCase(service?.key) || "Service",
        category: normalizeString(service?.category) || null,
        meta: asObject(service?.meta) ?? {},
        durationLabel: formatDurationLabel(durationMinutes),
        priceLabel: formatPriceLabel(priceCents, currencyCode),
        searchTerms: buildServiceSearchTerms(service),
      };
    });
}

export function buildSearchHaystack(post, tags = []) {
  return [post?.title, post?.text, ...tags]
    .map(normalizeKey)
    .filter(Boolean)
    .join(" ");
}

export function isTransformationContent({ images, portfolioMeta, tags, haystack }) {
  const explicitType = normalizeExplicitContentType(portfolioMeta?.type ?? portfolioMeta?.contentType);
  if (explicitType === CONTENT_TYPES.TRANSFORMATION) return true;

  const hasExplicitPair =
    Boolean(portfolioMeta?.beforeImage || portfolioMeta?.before_image) &&
    Boolean(portfolioMeta?.afterImage || portfolioMeta?.after_image);

  if (hasExplicitPair) return true;
  if (images.length < 2) return false;

  const tagSet = new Set(tags.map(normalizeKey));
  const hasBeforeTag = tagSet.has("before");
  const hasAfterTag = tagSet.has("after");
  if (hasBeforeTag && hasAfterTag) return true;

  return TRANSFORMATION_TERMS.some((term) => haystack.includes(term));
}

export function matchServiceForPost(services, portfolioMeta, tags = [], haystack = "") {
  const explicitServiceId = normalizeString(portfolioMeta?.serviceId ?? portfolioMeta?.service_id);
  const explicitServiceKey = normalizeKey(portfolioMeta?.serviceKey ?? portfolioMeta?.service_key);
  const explicitServiceLabel = normalizeKey(portfolioMeta?.serviceLabel ?? portfolioMeta?.service_label);

  const normalizedTags = new Set(tags.map(normalizeKey));
  const text = normalizeString(haystack);

  let bestService = null;
  let bestScore = 0;

  for (const service of services) {
    if (!service) continue;

    const serviceId = normalizeString(service.id);
    const serviceKey = normalizeKey(service.key);
    const serviceLabel = normalizeKey(service.label);
    const terms = Array.isArray(service.searchTerms) ? service.searchTerms : [];

    let score = 0;

    if (explicitServiceId && serviceId && explicitServiceId === serviceId) {
      score = 100;
    } else if (explicitServiceKey && serviceKey && explicitServiceKey === serviceKey) {
      score = 95;
    } else if (explicitServiceLabel && serviceLabel && explicitServiceLabel === serviceLabel) {
      score = 90;
    } else {
      for (const term of terms) {
        if (!term) continue;
        if (normalizedTags.has(term)) {
          score = Math.max(score, 60);
        } else if (text.includes(term)) {
          score = Math.max(score, 40);
        }
      }
    }

    if (score > bestScore) {
      bestService = service;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestService : null;
}
