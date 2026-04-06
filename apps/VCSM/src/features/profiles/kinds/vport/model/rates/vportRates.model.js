function toStr(v) {
  const s = (v ?? "").toString().trim();
  return s || null;
}

function toNumOrNull(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toObj(v) {
  return v && typeof v === "object" ? v : {};
}

/**
 * Model: translate raw vc.vport_rates row -> domain-safe rate object.
 * No DB, no permissions, pure.
 */
export function mapVportRateRow(row) {
  if (!row || typeof row !== "object") return null;

  return {
    id: toStr(row.id),
    actorId: toStr(row.actor_id),
    rateType: toStr(row.rate_type) ?? "fx",
    baseCurrency: toStr(row.base_currency),
    quoteCurrency: toStr(row.quote_currency),
    buyRate: toNumOrNull(row.buy_rate),
    sellRate: toNumOrNull(row.sell_rate),
    meta: toObj(row.meta),
    updatedAt: toStr(row.updated_at),
    createdAt: toStr(row.created_at),
  };
}

/**
 * Model: translate list.
 */
export function mapVportRateRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map(mapVportRateRow).filter(Boolean);
}

/**
 * Model: compute lastUpdated from domain rates (still pure).
 */
export function computeLastUpdated(rates) {
  const list = Array.isArray(rates) ? rates : [];

  let best = null;
  let bestMs = null;

  for (const r of list) {
    const ts = r?.updatedAt ?? null;
    if (!ts) continue;

    const ms = new Date(ts).getTime();
    if (!Number.isFinite(ms)) continue;

    if (bestMs === null || ms > bestMs) {
      bestMs = ms;
      best = ts;
    }
  }

  return best;
}