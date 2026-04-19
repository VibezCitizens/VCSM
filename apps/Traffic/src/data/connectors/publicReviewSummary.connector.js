import { getPublicReviewSummaryApiUrl } from "@/lib/env";
import { normalizeSlug } from "@/lib/slugs";

const REQUEST_TIMEOUT_MS = 4500;

function toNumberOrNull(value) {
  if (value == null || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

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

function toIntegerOrNull(value) {
  const numeric = toNumberOrNull(value);
  if (numeric == null) {
    return null;
  }

  return Math.max(0, Math.round(numeric));
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

  if (payload?.summary && typeof payload.summary === "object") {
    return [payload.summary];
  }

  return [];
}

function readStarCount(row, stars) {
  return (
    toIntegerOrNull(row?.[`rating_${stars}_count`]) ??
    toIntegerOrNull(row?.[`star_${stars}_count`]) ??
    toIntegerOrNull(row?.[`stars_${stars}_count`]) ??
    null
  );
}

function normalizeRatingBreakdown(row, reviewCount) {
  const breakdown = [5, 4, 3, 2, 1]
    .map((stars) => {
      const count = readStarCount(row, stars);
      if (count == null) {
        return null;
      }

      const percent = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : null;
      return {
        stars,
        count,
        percent
      };
    })
    .filter(Boolean);

  return breakdown.length ? breakdown : null;
}

function normalizeReviewSummary(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const actorId = String(
    row.target_actor_id ?? row.targetActorId ?? row.actor_id ?? row.actorId ?? ""
  ).trim() || null;

  const profileSlug =
    normalizeSlug(row.profile_slug ?? row.profileSlug ?? row.vport_slug ?? row.vportSlug) || null;

  const averageRating = toNumberOrNull(
    row.average_rating ?? row.averageRating ?? row.rating_avg ?? row.ratingAvg
  );

  const reviewCount =
    toIntegerOrNull(row.review_count ?? row.reviewCount) ??
    (averageRating != null ? 0 : null);

  if (averageRating == null && reviewCount == null && !actorId && !profileSlug) {
    return null;
  }

  return {
    actorId,
    profileSlug,
    averageRating,
    reviewCount,
    firstReviewAt: toIsoOrNull(row.first_review_at ?? row.firstReviewAt),
    lastReviewActivityAt: toIsoOrNull(
      row.last_review_activity_at ?? row.lastReviewActivityAt ?? row.updated_at ?? row.updatedAt
    ),
    ratingBreakdown: normalizeRatingBreakdown(row, reviewCount ?? 0)
  };
}

function rowMatchesFilters(summary, filters = {}) {
  const actorId = String(filters.actorId ?? "").trim();
  if (actorId && summary.actorId && summary.actorId !== actorId) {
    return false;
  }

  const profileSlug = normalizeSlug(filters.profileSlug);
  if (profileSlug && summary.profileSlug && summary.profileSlug !== profileSlug) {
    return false;
  }

  return true;
}

function buildEndpoint(filters = {}) {
  const apiUrl = getPublicReviewSummaryApiUrl();
  if (!apiUrl) {
    return null;
  }

  let url;
  try {
    url = new URL(apiUrl);
  } catch {
    return null;
  }

  const actorId = String(filters.actorId ?? "").trim();
  const profileSlug = normalizeSlug(filters.profileSlug);
  const limit = Number(filters.limit ?? 0);

  if (actorId) {
    url.searchParams.set("actor_id", actorId);
  }

  if (profileSlug) {
    url.searchParams.set("profile_slug", profileSlug);
  }

  if (Number.isFinite(limit) && limit > 0) {
    url.searchParams.set("limit", String(Math.floor(limit)));
  }

  return url.toString();
}

export async function fetchPublicReviewSummaries(filters = {}) {
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
    const rows = readRows(payload);

    const summaries = rows
      .map((row) => normalizeReviewSummary(row))
      .filter(Boolean)
      .filter((summary) => rowMatchesFilters(summary, filters));

    const limit = Number(filters.limit ?? 0);
    if (Number.isFinite(limit) && limit > 0) {
      return summaries.slice(0, Math.floor(limit));
    }

    return summaries;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchPublicReviewSummary(filters = {}) {
  const summaries = await fetchPublicReviewSummaries({
    ...filters,
    limit: filters.limit ?? 25
  });

  return summaries[0] ?? null;
}
