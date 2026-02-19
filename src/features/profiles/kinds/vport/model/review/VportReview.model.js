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

    // dynamic dimension key (vibez/food/service/restrooms/whatever)
    reviewType: row.review_type ?? null,

    rating: row.rating ?? null,
    body: row.body ?? null,

    isDeleted: row.is_deleted ?? false,

    createdAt: toIsoSafe(row.created_at),
    updatedAt: toIsoSafe(row.updated_at),

    // legacy compatibility (you may delete column in DB; keep mapping safe)
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
 * Stats model (dynamic)
 *
 * Accepts either:
 * - { [reviewTypeKey]: { count, avg } }  (recommended)
 * - legacy shapes
 *
 * Returns:
 * - { [reviewTypeKey]: { count, avg } }
 */
export function toVportReviewStats(input) {
  const normalizeAvg = (v) => {
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 10) / 10;
  };

  // 1) null/undefined
  if (!input) return {};

  // 2) if it already looks like a dynamic map: { vibez:{count,avg}, food:{...}, ... }
  if (typeof input === "object" && !Array.isArray(input)) {
    const keys = Object.keys(input);

    // If it has at least one key that looks like {count,avg}, treat as dynamic
    const looksDynamic = keys.some((k) => {
      const v = input[k];
      return v && typeof v === "object" && ("count" in v || "avg" in v);
    });

    if (looksDynamic) {
      const out = {};
      for (const k of keys) {
        const v = input[k];
        if (!v || typeof v !== "object") continue;
        out[k] = {
          count: Number(v.count ?? 0) || 0,
          avg: normalizeAvg(v.avg ?? null),
        };
      }
      return out;
    }
  }

  // 3) legacy shapes you had before (overall/food)
  const outLegacy = {};
  if (input?.overall || input?.food) {
    if (input?.overall) {
      outLegacy.overall = {
        count: Number(input.overall?.count ?? 0) || 0,
        avg: normalizeAvg(input.overall?.avg ?? null),
      };
    }
    if (input?.food) {
      outLegacy.food = {
        count: Number(input.food?.count ?? 0) || 0,
        avg: normalizeAvg(input.food?.avg ?? null),
      };
    }
    return outLegacy;
  }

  // 4) old/flat legacy
  if (
    "overall_count" in input ||
    "overall_avg" in input ||
    "food_count" in input ||
    "food_avg" in input
  ) {
    outLegacy.overall = {
      count: Number(input.overall_count ?? 0) || 0,
      avg: normalizeAvg(input.overall_avg ?? null),
    };
    outLegacy.food = {
      count: Number(input.food_count ?? 0) || 0,
      avg: normalizeAvg(input.food_avg ?? null),
    };
    return outLegacy;
  }

  // fallback
  return {};
}
