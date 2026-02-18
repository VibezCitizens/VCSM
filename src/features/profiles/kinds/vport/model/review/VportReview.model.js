// src/features/profiles/kinds/vport/model/review/VportReview.model.js

/**
 * Model: vc.vport_reviews row -> domain-safe object
 * Pure translation only (no I/O).
 */

function toIsoSafe(v) {
  if (!v) return null;

  // already ISO-ish
  if (typeof v === "string" && v.includes("T")) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  // fix "YYYY-MM-DD HH:mm:ss(.sss)+00" -> "YYYY-MM-DDTHH:mm:ss(.sss)Z"
  if (typeof v === "string") {
    const s = v
      .replace(" ", "T")
      .replace(/\+00$/, "Z")
      .replace(/\+00:00$/, "Z");

    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();

    // last fallback: try Date() raw
    const d2 = new Date(v);
    return Number.isNaN(d2.getTime()) ? null : d2.toISOString();
  }

  // Date object, number, etc.
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function toVportReview(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,

    authorActorId: row.author_actor_id ?? null,
    targetActorId: row.target_actor_id ?? null,

    reviewType: row.review_type ?? null, // "overall" | "food"

    rating: row.rating ?? null,
    body: row.body ?? null,

    isDeleted: row.is_deleted ?? false,

    createdAt: toIsoSafe(row.created_at),
    updatedAt: toIsoSafe(row.updated_at),

    weekStart: row.week_start ?? null,
  };
}

/**
 * List mapper
 */
export function toVportReviewList(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map(toVportReview).filter(Boolean);
}

/**
 * Stats model: tolerant mapper.
 */
export function toVportReviewStats(input) {
  const fallback = {
    overall: { count: 0, avg: null },
    food: { count: 0, avg: null },
  };

  if (!input) return fallback;

  const normalizeAvg = (v) => {
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 10) / 10;
  };

  // New refactor shape
  if (input?.overall && input?.food) {
    return {
      overall: {
        count: Number(input.overall?.count ?? 0) || 0,
        avg: normalizeAvg(input.overall?.avg ?? null),
      },
      food: {
        count: Number(input.food?.count ?? 0) || 0,
        avg: normalizeAvg(input.food?.avg ?? null),
      },
    };
  }

  // Old/flat shape
  return {
    overall: {
      count: Number(input.overall_count ?? 0) || 0,
      avg: normalizeAvg(input.overall_avg ?? null),
    },
    food: {
      count: Number(input.food_count ?? 0) || 0,
      avg: normalizeAvg(input.food_avg ?? null),
    },
  };
}
