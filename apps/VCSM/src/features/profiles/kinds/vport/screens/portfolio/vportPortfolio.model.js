const CONTENT_TYPES = Object.freeze({
  SINGLE: "single",
  GALLERY: "gallery",
  TRANSFORMATION: "transformation",
});

const FILTER_KEYS = Object.freeze({
  ALL: "all",
  TRANSFORMATION: "type:transformation",
});

const TRANSFORMATION_TERMS = [
  "before and after",
  "before & after",
  "before/after",
  "before-after",
  "transformation",
];

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  const safe = normalizeString(value);
  if (!safe) return "";

  return safe
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toSentenceCase(value) {
  const safe = normalizeString(value);
  if (!safe) return "";
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeString).filter(Boolean))];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function normalizeImageEntry(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const url = normalizeString(entry);
    return url ? { url } : null;
  }

  const url = normalizeString(entry?.url ?? entry?.media_url ?? entry?.src);
  if (!url) return null;

  return { url };
}

function normalizeImageList(list) {
  return (Array.isArray(list) ? list : []).map(normalizeImageEntry).filter(Boolean);
}

function readPortfolioMeta(post) {
  const candidates = [
    post?.portfolio,
    post?.portfolioMeta,
    post?.portfolio_meta,
    post?.meta?.portfolio,
  ];

  return candidates.map(asObject).find(Boolean) ?? null;
}

function normalizeExplicitContentType(value) {
  const type = normalizeKey(value);

  if (type === CONTENT_TYPES.TRANSFORMATION) return CONTENT_TYPES.TRANSFORMATION;
  if (type === CONTENT_TYPES.GALLERY) return CONTENT_TYPES.GALLERY;
  if (type === CONTENT_TYPES.SINGLE) return CONTENT_TYPES.SINGLE;

  return null;
}

function extractPostImages(post, portfolioMeta) {
  const explicitGallery = normalizeImageList(portfolioMeta?.galleryImages ?? portfolioMeta?.gallery_images);
  const explicitBefore = normalizeImageEntry(portfolioMeta?.beforeImage ?? portfolioMeta?.before_image);
  const explicitAfter = normalizeImageEntry(portfolioMeta?.afterImage ?? portfolioMeta?.after_image);

  if (explicitGallery.length) {
    return {
      images: explicitGallery,
      beforeImage: explicitBefore,
      afterImage: explicitAfter,
    };
  }

  const mediaImages = (Array.isArray(post?.media) ? post.media : [])
    .filter((item) => item?.type === "image" && normalizeString(item?.url))
    .map((item) => ({ url: item.url }));

  return {
    images: mediaImages,
    beforeImage: explicitBefore,
    afterImage: explicitAfter,
  };
}

function buildServiceSearchTerms(service) {
  const terms = [
    service?.label,
    service?.key,
    service?.category,
    ...(Array.isArray(service?.meta?.aliases) ? service.meta.aliases : []),
    ...(Array.isArray(service?.meta?.tags) ? service.meta.tags : []),
  ];

  return uniqueStrings(terms.map(normalizeKey));
}

function buildPortfolioServices(services = [], serviceProfiles = []) {
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

function buildSearchHaystack(post, tags = []) {
  return [post?.title, post?.text, ...tags]
    .map(normalizeKey)
    .filter(Boolean)
    .join(" ");
}

function isTransformationContent({ images, portfolioMeta, tags, haystack }) {
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

function matchServiceForPost(services, portfolioMeta, tags = [], haystack = "") {
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

function formatDateLabel(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatPriceLabel(priceCents, currencyCode = "USD") {
  const amount = Number(priceCents);
  if (!Number.isFinite(amount) || amount < 0) return null;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 2,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}

function formatDurationLabel(durationMinutes) {
  const minutes = Number(durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!remainder) {
    return hours === 1 ? "1 hr" : `${hours} hrs`;
  }

  return `${hours} hr ${remainder} min`;
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
