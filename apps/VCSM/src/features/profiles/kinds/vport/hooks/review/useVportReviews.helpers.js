export function normalizeInput(input) {
  if (!input) return { targetActorId: null, viewerActorId: null, vportType: null };
  if (typeof input === "string") {
    return { targetActorId: input, viewerActorId: null, vportType: null };
  }
  if (typeof input === "object") {
    return {
      targetActorId: input.targetActorId ?? null,
      viewerActorId: input.viewerActorId ?? null,
      vportType: input.vportType ?? null,
    };
  }
  return { targetActorId: null, viewerActorId: null, vportType: null };
}

export function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function round4(n) {
  if (n == null) return null;
  return Math.round(n * 10000) / 10000;
}

export function computeDimStatsFromReviews(reviews) {
  const map = new Map();

  for (const r of reviews || []) {
    const ratings = r?.ratings ?? r?.dimensionRatings ?? r?.dimension_ratings ?? [];
    if (!Array.isArray(ratings)) continue;

    for (const rr of ratings) {
      const key = rr?.dimensionKey ?? rr?.dimension_key ?? rr?.key ?? null;
      const rating = safeNum(rr?.rating);
      if (!key || rating == null) continue;

      const cur = map.get(key) ?? { sum: 0, count: 0 };
      cur.sum += rating;
      cur.count += 1;
      map.set(key, cur);
    }
  }

  const out = {};
  for (const [k, v] of map.entries()) {
    out[k] = {
      avg: v.count ? round4(v.sum / v.count) : null,
      count: v.count,
    };
  }
  return out;
}

export function pickRecentComments(reviews, n = 6) {
  const rows = Array.isArray(reviews) ? reviews : [];
  return rows
    .filter((r) => String(r?.body ?? "").trim().length > 0)
    .slice(0, n)
    .map((r) => ({
      id: r?.id ?? null,
      body: r?.body ?? "",
      createdAt: r?.createdAt ?? r?.created_at ?? null,
      overallRating: r?.overallRating ?? r?.overall_rating ?? null,
    }));
}
