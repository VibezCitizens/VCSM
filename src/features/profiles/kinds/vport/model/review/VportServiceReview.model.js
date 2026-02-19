// src/features/profiles/kinds/vport/model/review/VportServiceReview.model.js

/**
 * Model: vc.vport_service_reviews row -> domain-safe object
 * Pure translation only (no I/O).
 */

function toIsoSafe(v) {
  if (!v) return null;

  if (typeof v === "string" && v.includes("T")) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  if (typeof v === "string") {
    const s = v
      .replace(" ", "T")
      .replace(/\+00$/, "Z")
      .replace(/\+00:00$/, "Z");

    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();

    const d2 = new Date(v);
    return Number.isNaN(d2.getTime()) ? null : d2.toISOString();
  }

  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function toVportServiceReview(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,

    authorActorId: row.author_actor_id ?? null,
    serviceId: row.service_id ?? null,

    rating: row.rating ?? null,
    body: row.body ?? null,

    isDeleted: row.is_deleted ?? false,

    createdAt: toIsoSafe(row.created_at),
    updatedAt: toIsoSafe(row.updated_at),

    // legacy compatibility if column still exists somewhere
    weekStart: row.week_start ?? null,
  };
}

export function toVportServiceReviewList(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map(toVportServiceReview).filter(Boolean);
}

export function toVportServiceReviewStats(row) {
  if (!row) return { count: 0, avg: null };

  const count = row.count ?? row.review_count ?? 0;
  const avgRaw = row.avg ?? row.avg_rating ?? null;

  const avg =
    avgRaw == null ? null : Math.round(Number(avgRaw) * 10) / 10;

  return {
    count: Number(count) || 0,
    avg: avg == null || Number.isNaN(avg) ? null : avg,
  };
}
