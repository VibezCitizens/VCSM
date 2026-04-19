import { getPublicContentApiUrl } from "@/lib/env";
import { normalizeSlug, slugEquals } from "@/lib/slugs";

const REQUEST_TIMEOUT_MS = 4500;

function normalizeCategory(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeServiceKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSlug(entry)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => normalizeSlug(entry))
      .filter(Boolean);
  }

  return [];
}

function tokenizeLocation(value) {
  return String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9-]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildEndpoint(filters = {}) {
  const apiUrl = getPublicContentApiUrl();
  if (!apiUrl) {
    return null;
  }

  let url;
  try {
    url = new URL(apiUrl);
  } catch {
    return null;
  }

  const contentSlug = normalizeSlug(filters.contentSlug ?? filters.slug);
  const profileSlug = normalizeSlug(filters.profileSlug);
  const category = normalizeCategory(filters.category);
  const serviceKey = normalizeSlug(filters.serviceKey);
  const location = normalizeSlug(filters.location);
  const limit = Number(filters.limit ?? 0);

  if (contentSlug) {
    url.searchParams.set("content_slug", contentSlug);
  }

  if (profileSlug) {
    url.searchParams.set("profile_slug", profileSlug);
  }

  if (category) {
    url.searchParams.set("category", category);
  }

  if (serviceKey) {
    url.searchParams.set("service_key", serviceKey);
  }

  if (location) {
    url.searchParams.set("location", location);
  }

  if (Number.isFinite(limit) && limit > 0) {
    url.searchParams.set("limit", String(Math.floor(limit)));
  }

  return url.toString();
}

function readRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  return [];
}

function isObjectRow(row) {
  return Boolean(row && typeof row === "object" && !Array.isArray(row));
}

function rowMatchesFilters(row, filters = {}) {
  const contentSlug = normalizeSlug(filters.contentSlug ?? filters.slug);
  const profileSlug = normalizeSlug(filters.profileSlug);
  const category = normalizeCategory(filters.category);
  const serviceKey = normalizeSlug(filters.serviceKey);
  const location = normalizeSlug(filters.location);

  if (contentSlug) {
    const rowSlug = row.content_slug ?? row.contentSlug ?? row.slug ?? row.page_slug ?? row.pageSlug;
    if (!slugEquals(rowSlug, contentSlug)) {
      return false;
    }
  }

  if (profileSlug) {
    const rowProfileSlug = row.profile_slug ?? row.profileSlug;
    if (!slugEquals(rowProfileSlug, profileSlug)) {
      return false;
    }
  }

  if (category) {
    const rowCategory = normalizeCategory(row.category);
    if (rowCategory !== category) {
      return false;
    }
  }

  if (serviceKey) {
    const serviceKeys = normalizeServiceKeys(row.service_keys ?? row.serviceKeys);
    if (!serviceKeys.includes(serviceKey)) {
      return false;
    }
  }

  if (location) {
    const locationTokens = new Set([
      ...tokenizeLocation(row.location_relevance ?? row.locationRelevance),
      ...tokenizeLocation(row.location_text ?? row.locationText),
      normalizeSlug(row.profile_slug ?? row.profileSlug),
      normalizeSlug(row.country_code ?? row.countryCode)
    ].filter(Boolean));

    if (!locationTokens.has(location)) {
      return false;
    }
  }

  return true;
}

export async function fetchPublicContentReadModelRows(filters = {}) {
  const endpoint = buildEndpoint(filters);
  if (!endpoint) {
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      next: { revalidate: 900 },
      signal: controller.signal
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json().catch(() => null);
    const rows = readRows(payload).filter(isObjectRow);
    const filtered = rows.filter((row) => rowMatchesFilters(row, filters));

    const limit = Number(filters.limit ?? 0);
    if (Number.isFinite(limit) && limit > 0) {
      return filtered.slice(0, Math.floor(limit));
    }

    return filtered;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchPublicContentReadModelRow(filters = {}) {
  const rows = await fetchPublicContentReadModelRows({
    ...filters,
    limit: filters.limit ?? 25
  });

  return rows[0] ?? null;
}
