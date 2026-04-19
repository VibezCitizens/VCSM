/**
 * Model: normalizers for public VPORT review data shapes.
 * Handles summary, review cards, and dimension rows.
 */

function toFloat(value, fallback = null) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toText(value) {
  return String(value ?? "").trim();
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function normalizePublicReviewSummary(raw) {
  if (!raw) {
    return { reviewCount: 0, averageRating: null, firstReviewAt: null, lastReviewActivityAt: null };
  }
  return {
    reviewCount: toInt(raw.review_count, 0),
    averageRating: toFloat(raw.average_rating),
    firstReviewAt: raw.first_review_at ?? null,
    lastReviewActivityAt: raw.last_review_activity_at ?? null,
  };
}

// ─── Review card ──────────────────────────────────────────────────────────────

export function normalizePublicReviewCard(raw) {
  if (!raw?.review_id) return null;
  return {
    id: raw.review_id,
    targetActorId: raw.target_actor_id ?? null,
    authorActorId: raw.author_actor_id ?? null,
    verificationStatus: raw.verification_status ?? null,
    overallRating: toFloat(raw.overall_rating),
    body: toText(raw.body) || null,
    authorDisplayName: toText(raw.author_display_name_snapshot) || "Anonymous",
    authorUsername: toText(raw.author_username_snapshot) || null,
    authorAvatarUrl: toText(raw.author_avatar_url_snapshot) || null,
    reviewActivityAt: raw.review_activity_at ?? raw.created_at ?? null,
    createdAt: raw.created_at ?? null,
  };
}

export function normalizePublicReviewCards(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(normalizePublicReviewCard).filter(Boolean);
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

export function normalizePublicReviewDimension(raw) {
  if (!raw?.dimension_id) return null;
  return {
    id: raw.dimension_id,
    key: raw.dimension_key ?? null,
    label: toText(raw.dimension_label) || raw.dimension_key || "Rating",
    sortOrder: toInt(raw.sort_order, 0),
    ratingCount: toInt(raw.rating_count, 0),
    averageRating: toFloat(raw.average_rating),
  };
}

export function normalizePublicReviewDimensions(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(normalizePublicReviewDimension)
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
