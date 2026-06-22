import { useCallback, useMemo, useState } from "react";
import useUpsertVportRate from "@/features/profiles/kinds/vport/adapters/hooks/rates/useUpsertVportRate.adapter";
import {
  usePublishExchangeRatePost,
  mapVportRateRow,
} from "@/features/profiles/kinds/vport/adapters/exchange.adapter";
import {
  normalizeCurrencyCode,
  toNumOrNull,
  toRatePairKey,
  formatPublishToast,
} from "../model/exchangeRate.model";

export function useExchangeRateEditor({ actorId }) {
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [quoteCurrency, setQuoteCurrency] = useState("MXN");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [optimisticRatesByPair, setOptimisticRatesByPair] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [shareToFeed, setShareToFeed] = useState(true);

  const m = useUpsertVportRate({ actorId, rateType: "fx" });
  const { publishExchangeRatePost } = usePublishExchangeRatePost({ actorId });

  const optimisticRates = useMemo(
    () => Object.values(optimisticRatesByPair || {}),
    [optimisticRatesByPair]
  );

  const showToast = useCallback((message) => {
    setToastMessage(String(message || ""));
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 0);
  }, []);

  const onSave = useCallback(async () => {
    if (!actorId) return;
    const safeBase = normalizeCurrencyCode(baseCurrency);
    const safeQuote = normalizeCurrencyCode(quoteCurrency);
    const pairKey = toRatePairKey({ rateType: "fx", baseCurrency: safeBase, quoteCurrency: safeQuote });
    if (!pairKey) return;

    const nowIso = new Date().toISOString();
    const previousOptimistic = optimisticRatesByPair?.[pairKey] ?? null;
    const optimisticRate = {
      id: `optimistic:${pairKey}:${nowIso}`,
      actorId,
      rateType: "fx",
      baseCurrency: safeBase,
      quoteCurrency: safeQuote,
      buyRate: toNumOrNull(buyRate),
      sellRate: toNumOrNull(sellRate),
      meta: {},
      updatedAt: nowIso,
      createdAt: nowIso,
    };

    setOptimisticRatesByPair((prev) => ({ ...prev, [pairKey]: optimisticRate }));

    try {
      const saved = await m.upsert({
        actorId,
        rateType: "fx",
        baseCurrency: safeBase,
        quoteCurrency: safeQuote,
        buyRate,
        sellRate,
      });

      const mapped = saved ? { ...mapVportRateRow(saved), actorId } : optimisticRate;
      setOptimisticRatesByPair((prev) => ({ ...prev, [pairKey]: mapped }));

      setBuyRate("");
      setSellRate("");
      setRefreshSeed((n) => n + 1);

      let publishResult = null;
      if (shareToFeed) {
        try {
          publishResult = await publishExchangeRatePost({
            baseCurrency: safeBase,
            quoteCurrency: safeQuote,
            buyRate: mapped.buyRate ?? buyRate,
            sellRate: mapped.sellRate ?? sellRate,
          });
        } catch (err) {
          publishResult = {
            published: false,
            status: "failed",
            reason: err?.message ?? "publish_failed",
          };
        }
      }

      showToast(
        formatPublishToast({ pairLabel: `${safeBase}/${safeQuote}`, shareToFeed, publishResult })
      );
    } catch {
      setOptimisticRatesByPair((prev) => {
        const next = { ...prev };
        if (previousOptimistic) next[pairKey] = previousOptimistic;
        else delete next[pairKey];
        return next;
      });
    }
  }, [m, actorId, baseCurrency, quoteCurrency, buyRate, sellRate, optimisticRatesByPair, showToast, shareToFeed, publishExchangeRatePost]);

  return {
    baseCurrency,
    setBaseCurrency,
    quoteCurrency,
    setQuoteCurrency,
    buyRate,
    setBuyRate,
    sellRate,
    setSellRate,
    refreshSeed,
    optimisticRates,
    toastOpen,
    setToastOpen,
    toastMessage,
    shareToFeed,
    setShareToFeed,
    isLoading: m.isLoading,
    error: m.error?.message ?? m.error ?? null,
    onSave,
  };
}
