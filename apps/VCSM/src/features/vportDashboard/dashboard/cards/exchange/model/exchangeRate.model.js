export function normalizeCurrencyCode(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function toNumOrNull(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function toRatePairKey({ rateType = "fx", baseCurrency, quoteCurrency }) {
  const safeRateType = String(rateType ?? "fx").trim().toLowerCase();
  const safeBase = normalizeCurrencyCode(baseCurrency);
  const safeQuote = normalizeCurrencyCode(quoteCurrency);
  if (!safeBase || !safeQuote) return null;
  return `${safeRateType}:${safeBase}/${safeQuote}`;
}

export function formatPublishToast({ pairLabel, shareToFeed, publishResult }) {
  if (!shareToFeed) return `Exchange rate saved: ${pairLabel}`;
  if (publishResult?.status === "published") return `Exchange rate saved and shared: ${pairLabel}`;
  if (publishResult?.status === "skipped")
    return `Exchange rate saved. Feed share skipped: ${publishResult.reason ?? "recent post"}`;
  return `Exchange rate saved. Feed share failed.`;
}
