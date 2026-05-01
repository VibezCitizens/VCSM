import {
  fetchPublicReviewSummaries,
  fetchPublicReviewSummary
} from "@/data/connectors/publicReviewSummary.connector";
import {
  fetchProviderReviews,
  fetchProviderReviewSummary
} from "@/data/connectors/providerReviews.connector";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getCountryBySlug } from "@/data/repositories/geo.repo";
import { getProviderBySlug } from "@/data/repositories/provider.repo";
import { normalizeSlug } from "@/lib/slugs";

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.max(0, Math.round(numeric));
}

function buildTrustBadge(summary) {
  if (!summary) {
    return null;
  }

  const reviewCount = summary.reviewCount ?? 0;
  const averageRating = summary.averageRating ?? 0;

  if (reviewCount >= 250 && averageRating >= 4.8) {
    return "Top Rated";
  }

  if (reviewCount >= 100 && averageRating >= 4.6) {
    return "Highly Rated";
  }

  if (reviewCount >= 30 && averageRating >= 4.4) {
    return "Trusted Local";
  }

  if (reviewCount >= 10) {
    return "Verified Feedback";
  }

  return null;
}

function normalizeReviewSummary(summary, fallback = {}) {
  if (!summary && !fallback) {
    return null;
  }

  const actorId = String(summary?.actorId ?? fallback.actorId ?? "").trim() || null;
  const profileSlug =
    normalizeSlug(summary?.profileSlug ?? fallback.profileSlug ?? "") || null;

  const averageRating = toNumber(summary?.averageRating ?? fallback.averageRating);
  const reviewCount = toCount(summary?.reviewCount ?? fallback.reviewCount);

  if (averageRating == null && reviewCount == null) {
    return null;
  }

  const normalized = {
    actorId,
    profileSlug,
    averageRating,
    reviewCount: reviewCount ?? 0,
    firstReviewAt: summary?.firstReviewAt ?? null,
    lastReviewActivityAt: summary?.lastReviewActivityAt ?? fallback.lastReviewActivityAt ?? null,
    ratingBreakdown: Array.isArray(summary?.ratingBreakdown) ? summary.ratingBreakdown : null
  };

  normalized.trustBadge = buildTrustBadge(normalized);
  return normalized;
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

function toStarBuckets(values) {
  const buckets = new Map([[5, 0], [4, 0], [3, 0], [2, 0], [1, 0]]);

  values.forEach((value) => {
    const normalized = Math.max(1, Math.min(5, Math.round(value)));
    buckets.set(normalized, (buckets.get(normalized) ?? 0) + 1);
  });

  return [5, 4, 3, 2, 1]
    .map((stars) => {
      const count = buckets.get(stars) ?? 0;
      if (count <= 0) {
        return null;
      }

      return {
        stars,
        count,
        percent: Math.round((count / values.length) * 100)
      };
    })
    .filter(Boolean);
}

async function fetchLiveProviderReviews(provider, limit = 50) {
  if (!provider?.vcsmActorId) {
    return [];
  }

  return fetchProviderReviews(provider.vcsmActorId, { limit }).catch(() => []);
}

async function fetchLiveProviderSummary(provider) {
  if (!provider?.vcsmActorId) {
    return null;
  }

  return fetchProviderReviewSummary(provider.vcsmActorId).catch(() => null);
}

function buildSummaryFromLiveReviews(provider, rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const ratings = rows
    .map((row) => toNumber(row?.overall_rating))
    .filter((value) => Number.isFinite(value) && value > 0);

  const averageRating = ratings.length
    ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10
    : null;

  const lastReviewActivityAt = rows
    .map((row) => toIsoOrNull(row?.review_activity_at))
    .filter(Boolean)
    .sort()
    .pop() ?? null;

  return normalizeReviewSummary({
    actorId: provider?.vcsmActorId ?? null,
    profileSlug: normalizeSlug(provider?.vcsmSlug ?? provider?.slug ?? ""),
    averageRating,
    reviewCount: rows.length,
    lastReviewActivityAt,
    ratingBreakdown: ratings.length ? toStarBuckets(ratings) : null
  });
}

function normalizeVisibleReview(row) {
  const id = String(row?.id ?? "").trim();
  if (!id) {
    return null;
  }

  const rating = toNumber(row?.overall_rating);
  const body = String(row?.body ?? "").trim();
  const authorName = String(row?.author_display_name_snapshot ?? "").trim() || "Anonymous";
  const reviewedAt = toIsoOrNull(row?.review_activity_at);

  // Only render review cards when there is written feedback.
  if (!body) {
    return null;
  }

  return {
    id,
    rating,
    body: body || null,
    authorName,
    authorAvatarUrl: String(row?.author_avatar_url_snapshot ?? "").trim() || null,
    reviewedAt
  };
}

function buildFallbackFromStats(provider, stats) {
  if (!stats || typeof stats !== "object") {
    return null;
  }

  return normalizeReviewSummary(null, {
    actorId: provider?.vcsmActorId ?? null,
    profileSlug: provider?.vcsmSlug ?? provider?.slug ?? null,
    averageRating: stats.ratingAvg,
    reviewCount: stats.reviewCount,
    lastReviewActivityAt: stats.updatedAt ?? null
  });
}

function buildProviderCacheTag(providerSlug) {
  const normalizedProviderSlug = normalizeSlug(providerSlug);
  if (!normalizedProviderSlug) {
    return undefined;
  }

  return [`provider:${normalizedProviderSlug}`];
}

export async function getPublicReviewSummaryByActorId(actorId, options = {}) {
  const normalizedActorId = String(actorId ?? "").trim();
  if (!normalizedActorId) {
    return null;
  }

  const summary = await fetchPublicReviewSummary({
    actorId: normalizedActorId,
    profileSlug: options.profileSlug,
    providerSlug: options.providerSlug,
    cacheTags: options.cacheTags ?? buildProviderCacheTag(options.providerSlug)
  }).catch(() => null);

  return normalizeReviewSummary(summary);
}

export async function getPublicReviewSummaryByProfileSlug(profileSlug, options = {}) {
  const normalizedProfileSlug = normalizeSlug(profileSlug);
  if (!normalizedProfileSlug) {
    return null;
  }

  const summary = await fetchPublicReviewSummary({
    profileSlug: normalizedProfileSlug,
    providerSlug: options.providerSlug ?? normalizedProfileSlug,
    cacheTags: options.cacheTags ?? buildProviderCacheTag(options.providerSlug ?? normalizedProfileSlug)
  }).catch(() => null);

  return normalizeReviewSummary(summary);
}

export async function listPublicReviewSummaries(filters = {}) {
  const summaries = await fetchPublicReviewSummaries(filters).catch(() => []);
  return summaries
    .map((summary) => normalizeReviewSummary(summary))
    .filter(Boolean);
}

export async function getPublicReviewSummaryForProvider(provider, stats = null, options = {}) {
  if (!provider) {
    return normalizeReviewSummary(null, {
      averageRating: stats?.ratingAvg,
      reviewCount: stats?.reviewCount,
      lastReviewActivityAt: stats?.updatedAt
    });
  }

  if (provider.vcsmActorId) {
    const actorSummary = await getPublicReviewSummaryByActorId(provider.vcsmActorId, {
      profileSlug: normalizeSlug(provider.vcsmSlug) ?? undefined,
      providerSlug: normalizeSlug(provider.slug) ?? undefined
    });
    if (actorSummary) {
      return actorSummary;
    }
  }

  const profileCandidates = [
    normalizeSlug(provider.vcsmSlug),
    normalizeSlug(provider.slug)
  ].filter(Boolean);

  for (const candidate of profileCandidates) {
    const profileSummary = await getPublicReviewSummaryByProfileSlug(candidate, {
      providerSlug: normalizeSlug(provider.slug) ?? candidate
    });
    if (profileSummary) {
      return profileSummary;
    }
  }

  if (options.allowReviewsTableFallback === true) {
    const summaryRow = await fetchLiveProviderSummary(provider);
    const summaryFromPublicView = normalizeReviewSummary({
      actorId: summaryRow?.target_actor_id ?? provider?.vcsmActorId ?? null,
      profileSlug: normalizeSlug(provider?.vcsmSlug ?? provider?.slug ?? ""),
      averageRating: summaryRow?.average_rating ?? null,
      reviewCount: summaryRow?.review_count ?? null,
      firstReviewAt: summaryRow?.first_review_at ?? null,
      lastReviewActivityAt: summaryRow?.last_review_activity_at ?? null
    });
    if (summaryFromPublicView && (summaryFromPublicView.reviewCount ?? 0) > 0) {
      return summaryFromPublicView;
    }

    const rows = await fetchLiveProviderReviews(provider, options.fallbackReviewLimit ?? 50);
    const liveSummary = buildSummaryFromLiveReviews(provider, rows);
    if (liveSummary) {
      return liveSummary;
    }
  }

  return buildFallbackFromStats(provider, stats);
}

export async function listVisibleReviewsForProvider(provider, options = {}) {
  const limit = Number(options.limit ?? 3);
  const rows = await fetchLiveProviderReviews(
    provider,
    Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 3
  );

  return rows
    .map((row) => normalizeVisibleReview(row))
    .filter(Boolean);
}

export async function getPublicReviewSummaryForContentPage(page) {
  if (!page) {
    return null;
  }

  if (page.actorId) {
    const actorSummary = await getPublicReviewSummaryByActorId(page.actorId, {
      profileSlug: normalizeSlug(page.profileSlug) ?? undefined,
      providerSlug: normalizeSlug(page.providerSlug ?? page.profileSlug) ?? undefined
    });
    if (actorSummary) {
      return actorSummary;
    }
  }

  const profileCandidates = [
    normalizeSlug(page.profileSlug),
    normalizeSlug(page.providerSlug)
  ].filter(Boolean);

  for (const candidate of profileCandidates) {
    const profileSummary = await getPublicReviewSummaryByProfileSlug(candidate, {
      providerSlug: normalizeSlug(page.providerSlug ?? page.profileSlug) ?? candidate
    });
    if (profileSummary) {
      return profileSummary;
    }
  }

  const providerSlugCandidate = normalizeSlug(page.providerSlug ?? page.profileSlug);
  if (providerSlugCandidate) {
    let provider = null;

    if (page.countrySlug) {
      const country = getCountryBySlug(page.countrySlug);
      if (country) {
        provider = getProviderBySlug(providerSlugCandidate, { countryCode: country.code });
      }
    }

    if (!provider) {
      provider = getProviderBySlug(providerSlugCandidate);
    }

    if (provider) {
      return buildFallbackFromStats(provider, getProviderStats(provider.id));
    }
  }

  return null;
}
