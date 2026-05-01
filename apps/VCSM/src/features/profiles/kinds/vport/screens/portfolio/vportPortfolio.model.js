import {
  CONTENT_TYPES,
  FILTER_KEYS,
  normalizeString,
  normalizeKey,
  titleCase,
  toSentenceCase,
  uniqueStrings,
  normalizeImageEntry,
  readPortfolioMeta,
  extractPostImages,
  normalizeExplicitContentType,
  formatDateLabel,
} from "@/features/profiles/kinds/vport/screens/portfolio/vportPortfolioUtils.model";
import {
  buildPortfolioServices,
  buildSearchHaystack,
  isTransformationContent,
  matchServiceForPost,
} from "@/features/profiles/kinds/vport/screens/portfolio/vportPortfolioServiceMatch.model";

function deriveTitle(post, portfolioMeta, matchedService, type, tags = []) {
  const explicitTitle = normalizeString(portfolioMeta?.title);
  if (explicitTitle) return explicitTitle;

  const postTitle = normalizeString(post?.title);
  if (postTitle) return postTitle;

  if (matchedService?.label) {
    return type === CONTENT_TYPES.TRANSFORMATION
      ? `${matchedService.label} transformation`
      : matchedService.label;
  }

  if (tags.length > 0) {
    return titleCase(tags[0]);
  }

  if (type === CONTENT_TYPES.TRANSFORMATION) {
    return "Transformation";
  }

  return "Recent work";
}

function deriveDescription(post, portfolioMeta) {
  const explicit = normalizeString(portfolioMeta?.description);
  if (explicit) return explicit;

  const text = normalizeString(post?.text);
  return text || null;
}

function buildItemTags(postTags = [], matchedService = null, portfolioMeta = null) {
  const explicitTags = Array.isArray(portfolioMeta?.tags) ? portfolioMeta.tags : [];
  const combined = uniqueStrings([
    ...explicitTags,
    ...postTags,
    matchedService?.category,
    matchedService?.label,
  ]);

  return combined.slice(0, 6);
}

function buildFilterTokens(item) {
  return new Set(
    [
      item.type === CONTENT_TYPES.TRANSFORMATION ? FILTER_KEYS.TRANSFORMATION : null,
      ...item.tags.map(normalizeKey),
      normalizeKey(item.serviceLabel),
      normalizeKey(item.serviceCategory),
    ].filter(Boolean)
  );
}

function buildPortfolioItem(post, services) {
  const portfolioMeta = readPortfolioMeta(post);
  const { images, beforeImage, afterImage } = extractPostImages(post, portfolioMeta);

  if (!images.length) return null;

  const tags = Array.isArray(post?.tags) ? post.tags.filter(Boolean) : [];
  const haystack = buildSearchHaystack(post, tags);
  const matchedService = matchServiceForPost(services, portfolioMeta, tags, haystack);
  const isTransformation = isTransformationContent({
    images,
    portfolioMeta,
    tags,
    haystack,
  });

  const explicitType = normalizeExplicitContentType(portfolioMeta?.type ?? portfolioMeta?.contentType);
  const type =
    explicitType ??
    (isTransformation
      ? CONTENT_TYPES.TRANSFORMATION
      : images.length > 1
        ? CONTENT_TYPES.GALLERY
        : CONTENT_TYPES.SINGLE);

  const safeBeforeImage = beforeImage ?? (isTransformation ? images[0] : null);
  const safeAfterImage = afterImage ?? (isTransformation ? images[1] ?? images[0] : null);
  const coverImage = normalizeImageEntry(
    portfolioMeta?.coverImage ??
      portfolioMeta?.cover_image ??
      (type === CONTENT_TYPES.TRANSFORMATION ? safeAfterImage : images[0])
  );

  const tagsForItem = buildItemTags(tags, matchedService, portfolioMeta);
  const title = deriveTitle(post, portfolioMeta, matchedService, type, tags);
  const description = deriveDescription(post, portfolioMeta);

  const item = {
    id: normalizeString(post?.id),
    sourcePostId: normalizeString(post?.id),
    type,
    title,
    description,
    coverImage,
    beforeImage: type === CONTENT_TYPES.TRANSFORMATION ? safeBeforeImage : null,
    afterImage: type === CONTENT_TYPES.TRANSFORMATION ? safeAfterImage : null,
    galleryImages: images,
    serviceId: matchedService?.id ?? null,
    serviceLabel:
      normalizeString(portfolioMeta?.serviceLabel ?? portfolioMeta?.service_label) ||
      matchedService?.label ||
      null,
    serviceCategory: matchedService?.category ?? null,
    durationLabel:
      normalizeString(portfolioMeta?.durationLabel ?? portfolioMeta?.duration_label) ||
      matchedService?.durationLabel ||
      null,
    priceLabel:
      normalizeString(portfolioMeta?.priceLabel ?? portfolioMeta?.price_label) ||
      matchedService?.priceLabel ||
      null,
    tags: tagsForItem,
    createdAt: post?.createdAt ?? post?.created_at ?? null,
    createdAtLabel: formatDateLabel(post?.createdAt ?? post?.created_at),
    stats: {
      likeCount: Number(post?.likeCount ?? 0) || 0,
      roseCount: Number(post?.roseCount ?? 0) || 0,
    },
  };

  item.filterTokens = buildFilterTokens(item);
  return item;
}

function buildFilterItems(items = []) {
  const counts = new Map();

  counts.set(FILTER_KEYS.TRANSFORMATION, {
    key: FILTER_KEYS.TRANSFORMATION,
    label: "Transformations",
    count: 0,
  });

  for (const item of items) {
    if (!item) continue;
    if (item.type === CONTENT_TYPES.TRANSFORMATION) {
      counts.set(FILTER_KEYS.TRANSFORMATION, {
        key: FILTER_KEYS.TRANSFORMATION,
        label: "Transformations",
        count: (counts.get(FILTER_KEYS.TRANSFORMATION)?.count ?? 0) + 1,
      });
    }

    for (const token of item.filterTokens ?? []) {
      if (token === FILTER_KEYS.TRANSFORMATION) continue;
      const current = counts.get(token) ?? {
        key: token,
        label: titleCase(token),
        count: 0,
      };
      counts.set(token, { ...current, count: current.count + 1 });
    }
  }

  return Array.from(counts.values())
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 10);
}

export function buildRelatedServices(items = []) {
  const services = new Map();

  for (const item of items) {
    if (!item?.serviceLabel) continue;

    const key = normalizeString(item.serviceId) || normalizeKey(item.serviceLabel);
    const current = services.get(key) ?? {
      key,
      id: item.serviceId ?? null,
      label: item.serviceLabel,
      category: item.serviceCategory ?? null,
      durationLabel: item.durationLabel ?? null,
      priceLabel: item.priceLabel ?? null,
      workCount: 0,
    };

    services.set(key, {
      ...current,
      workCount: current.workCount + 1,
      durationLabel: current.durationLabel ?? item.durationLabel ?? null,
      priceLabel: current.priceLabel ?? item.priceLabel ?? null,
    });
  }

  return Array.from(services.values()).sort((a, b) => b.workCount - a.workCount || a.label.localeCompare(b.label));
}

export function filterPortfolioItems(items = [], activeFilter = FILTER_KEYS.ALL) {
  if (activeFilter === FILTER_KEYS.ALL) return items;

  return items.filter((item) => item?.filterTokens?.has(activeFilter));
}

export function buildVportPortfolioModel({ posts = [], services = [], serviceProfiles = [] } = {}) {
  const portfolioServices = buildPortfolioServices(services, serviceProfiles);
  const items = (Array.isArray(posts) ? posts : [])
    .map((post) => buildPortfolioItem(post, portfolioServices))
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });

  const transformationItems = items.filter((item) => item.type === CONTENT_TYPES.TRANSFORMATION);
  const workItems = items.filter((item) => item.type !== CONTENT_TYPES.TRANSFORMATION);
  const filters = buildFilterItems(items);
  const relatedServices = buildRelatedServices(items);
  const uniqueCategories = uniqueStrings(
    items.map((item) => item.serviceCategory).filter(Boolean)
  );

  return {
    items,
    transformationItems,
    workItems,
    filters,
    relatedServices,
    summary: {
      workCount: items.length,
      transformationCount: transformationItems.length,
      categoryCount: uniqueCategories.length || filters.length,
    },
  };
}

export function getPortfolioFilterKeyAll() {
  return FILTER_KEYS.ALL;
}

export function getPortfolioContentTypes() {
  return CONTENT_TYPES;
}

export function getPortfolioFilterKeys() {
  return FILTER_KEYS;
}

export function formatPortfolioTagLabel(value) {
  return toSentenceCase(titleCase(value));
}
