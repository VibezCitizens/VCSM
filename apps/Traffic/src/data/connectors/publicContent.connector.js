import {
  fetchPublicContentReadModelRow,
  fetchPublicContentReadModelRows
} from "@/data/dal/publicContent.read.dal";
import { normalizeSlug } from "@/lib/slugs";

const COUNTRY_CODE_TO_SLUG = {
  us: "us",
  ca: "canada",
  mx: "mexico",
  gb: "uk",
  es: "spain",
  fr: "france",
  de: "germany",
  ae: "uae",
  br: "brazil",
  in: "india"
};

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function toNumberOrNull(value) {
  if (value == null || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toTextArray(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      // fall back to delimiter parsing
    }
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }

    return inner
      .split(",")
      .map((entry) => entry.trim().replace(/^"(.*)"$/, "$1"))
      .map((entry) => entry.replace(/\\"/g, "\""))
      .filter(Boolean);
  }

  const separator = trimmed.includes("|") ? "|" : ",";
  return trimmed
    .split(separator)
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

function normalizeServiceKeys(value) {
  return [...new Set(toTextArray(value).map((entry) => normalizeSlug(entry)).filter(Boolean))];
}

function parseLocationSegments(value) {
  return String(value ?? "")
    .split("/")
    .map((segment) => normalizeSlug(segment))
    .filter(Boolean);
}

function deriveCountrySlug(row, locationSegments) {
  const explicit = normalizeSlug(row.country_slug ?? row.countrySlug);
  if (explicit) {
    return explicit;
  }

  if (locationSegments.length >= 2) {
    return locationSegments[0] ?? null;
  }

  const countryCode = normalizeSlug(row.country_code ?? row.countryCode);
  if (countryCode && COUNTRY_CODE_TO_SLUG[countryCode]) {
    return COUNTRY_CODE_TO_SLUG[countryCode];
  }

  return null;
}

function parseLocationContext(row) {
  const locationRelevance = String(row.location_relevance ?? row.locationRelevance ?? "").trim();
  const locationText = String(row.location_text ?? row.locationText ?? "").trim();
  const segments = parseLocationSegments(locationRelevance);

  const explicitCity = normalizeSlug(row.city_slug ?? row.citySlug);
  const explicitLocality = normalizeSlug(row.locality_slug ?? row.localitySlug);

  const countrySlug = deriveCountrySlug(row, segments);

  let citySlug = explicitCity;
  let localitySlug = explicitLocality;

  if (!citySlug) {
    if (segments.length >= 3) {
      citySlug = segments[1] ?? null;
    } else if (segments.length === 2) {
      citySlug = segments[1] ?? null;
    } else if (segments.length === 1) {
      citySlug = segments[0] ?? null;
    }
  }

  if (!localitySlug && segments.length >= 3) {
    localitySlug = segments[2] ?? null;
  }

  return {
    locationRelevance: locationRelevance || null,
    locationText: locationText || null,
    countrySlug,
    citySlug,
    localitySlug
  };
}

function normalizeContentPage(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const slug = normalizeSlug(row.content_slug ?? row.contentSlug ?? row.slug ?? row.page_slug ?? row.pageSlug);
  if (!slug) {
    return null;
  }

  const title = String(row.title ?? "").trim();
  if (!title) {
    return null;
  }

  const category = String(row.category ?? "guide").trim().toLowerCase() || "guide";
  const location = parseLocationContext(row);

  const publishedAt = toIsoOrNull(row.published_at ?? row.publishedAt);
  const updatedAt =
    toIsoOrNull(row.content_updated_at ?? row.contentUpdatedAt ?? row.updated_at ?? row.updatedAt) ??
    publishedAt;

  const profileSlug = normalizeSlug(row.profile_slug ?? row.profileSlug) || null;
  const profileName = String(row.profile_name ?? row.profileName ?? "").trim() || null;

  const excerpt = String(row.excerpt ?? "").trim();
  const body = String(row.body ?? "").trim();

  return {
    id: String(row.content_page_id ?? row.id ?? slug),
    contentPageId: String(row.content_page_id ?? row.id ?? slug),
    profileId: row.profile_id ?? row.profileId ?? null,
    actorId: row.actor_id ?? row.actorId ?? null,

    title,
    slug,
    publicUrl: String(row.public_url ?? row.publicUrl ?? "").trim() || null,
    excerpt: excerpt || null,
    body,

    category,
    serviceKeys: normalizeServiceKeys(row.service_keys ?? row.serviceKeys),
    locationRelevance: location.locationRelevance,
    locationText: location.locationText,
    countrySlug: location.countrySlug,
    citySlug: location.citySlug,
    localitySlug: location.localitySlug,

    seoTitle: String(row.seo_title ?? row.seoTitle ?? "").trim() || null,
    seoDescription: String(row.seo_description ?? row.seoDescription ?? "").trim() || null,

    isPublished: true,
    isIndexable: true,
    publishedAt,
    createdAt: toIsoOrNull(row.created_at ?? row.createdAt),
    updatedAt,

    profileSlug,
    profileName,
    profileBio: String(row.profile_bio ?? row.profileBio ?? "").trim() || null,
    profileAvatarUrl: String(row.profile_avatar_url ?? row.profileAvatarUrl ?? "").trim() || null,
    profileBannerUrl: String(row.profile_banner_url ?? row.profileBannerUrl ?? "").trim() || null,

    providerSlug: profileSlug,
    providerName: profileName,

    countryCode: String(row.country_code ?? row.countryCode ?? "").trim().toUpperCase() || null,
    locale: String(row.locale ?? "").trim() || null,
    timezone: String(row.timezone ?? "").trim() || null,
    lat: toNumberOrNull(row.lat),
    lng: toNumberOrNull(row.lng),

    logoUrl: String(row.logo_url ?? row.logoUrl ?? "").trim() || null,
    websiteUrl: String(row.website_url ?? row.websiteUrl ?? "").trim() || null,
    phonePublic: String(row.phone_public ?? row.phonePublic ?? "").trim() || null,
    emailPublic: String(row.email_public ?? row.emailPublic ?? "").trim() || null,

    highlights: toTextArray(row.highlights),
    languages: toTextArray(row.languages),
    paymentMethods: toTextArray(row.payment_methods ?? row.paymentMethods),

    primaryCategoryKey: normalizeSlug(row.primary_category_key ?? row.primaryCategoryKey) || null,
    primaryCategoryLabel: String(row.primary_category_label ?? row.primaryCategoryLabel ?? "").trim() || null
  };
}

function matchesNormalizedPage(page, filters = {}) {
  const category = String(filters.category ?? "").trim().toLowerCase();
  if (category && page.category !== category) {
    return false;
  }

  const serviceKey = normalizeSlug(filters.serviceKey);
  if (serviceKey && !page.serviceKeys.includes(serviceKey)) {
    return false;
  }

  const location = normalizeSlug(filters.location);
  if (location) {
    const locationTokens = new Set(
      [
        page.countrySlug,
        page.citySlug,
        page.localitySlug,
        page.countryCode,
        page.profileSlug,
        page.locationRelevance,
        page.locationText
      ]
        .map((entry) => normalizeSlug(entry))
        .filter(Boolean)
    );

    if (!locationTokens.has(location)) {
      return false;
    }
  }

  return true;
}

function applyLimit(items, limit) {
  const numeric = Number(limit ?? 0);
  if (Number.isFinite(numeric) && numeric > 0) {
    return items.slice(0, Math.floor(numeric));
  }

  return items;
}

export async function fetchPublicContentPages(filters = {}) {
  const rows = await fetchPublicContentReadModelRows(filters);
  const pages = rows
    .map((row) => normalizeContentPage(row))
    .filter(Boolean)
    .filter((page) => matchesNormalizedPage(page, filters));

  return applyLimit(pages, filters.limit);
}

export async function fetchPublicContentPageBySlug(contentSlug) {
  const normalizedSlug = normalizeSlug(contentSlug);
  if (!normalizedSlug) {
    return null;
  }

  const row = await fetchPublicContentReadModelRow({ contentSlug: normalizedSlug });
  const page = normalizeContentPage(row);

  if (page && page.slug === normalizedSlug) {
    return page;
  }

  const pages = await fetchPublicContentPages({ contentSlug: normalizedSlug, limit: 25 });
  return pages.find((entry) => entry.slug === normalizedSlug) ?? null;
}

export async function fetchPublicContentPageByProfileAndSlug(profileSlug, contentSlug) {
  const normalizedProfileSlug = normalizeSlug(profileSlug);
  const normalizedContentSlug = normalizeSlug(contentSlug);

  if (!normalizedProfileSlug || !normalizedContentSlug) {
    return null;
  }

  const row = await fetchPublicContentReadModelRow({
    profileSlug: normalizedProfileSlug,
    contentSlug: normalizedContentSlug
  });

  const page = normalizeContentPage(row);
  if (page && page.profileSlug === normalizedProfileSlug && page.slug === normalizedContentSlug) {
    return page;
  }

  const pages = await fetchPublicContentPages({
    profileSlug: normalizedProfileSlug,
    contentSlug: normalizedContentSlug,
    limit: 25
  });

  return (
    pages.find(
      (entry) => entry.profileSlug === normalizedProfileSlug && entry.slug === normalizedContentSlug
    ) ?? null
  );
}

export async function fetchPublicContentSlugs() {
  const rows = await fetchPublicContentReadModelRows();
  return [...new Set(rows.map((row) => normalizeSlug(row.content_slug ?? row.contentSlug ?? row.slug)).filter(Boolean))];
}
