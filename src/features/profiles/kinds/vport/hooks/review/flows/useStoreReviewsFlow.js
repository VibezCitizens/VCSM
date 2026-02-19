// src/features/profiles/kinds/vport/hooks/review/flows/useStoreReviewsFlow.js
import { useMemo, useState } from "react";
import {
  listVportReviewsController,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";
import { useAsyncEffect } from "@/features/profiles/kinds/vport/hooks/review/_shared/useAsyncEffect";

function computeWeightedOverallFromDimensionStats(statsByKey, dims) {
  let num = 0;
  let den = 0;

  for (const d of dims) {
    const avg = Number(statsByKey?.[d.key]?.avg);
    if (!Number.isFinite(avg)) continue;
    const w = Number.isFinite(d.weight) ? d.weight : 1;
    num += avg * w;
    den += w;
  }

  if (!den) return null;
  return Number((num / den).toFixed(2));
}

export function useStoreReviewsFlow({
  targetActorId,
  viewerActorId,
  tab,
  isServiceTab,
  setRating,
  setBody,
  dimensions,
}) {
  const [dimStats, setDimStats] = useState({});
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Kept for compatibility with existing UI (myExists, etc)
  const [myWeek, setMyWeek] = useState(null);
  const [loadingMyWeek, setLoadingMyWeek] = useState(false);

  // Dimension stats: compute avg/count per dimension by reading lists (client-side)
  useAsyncEffect(async (alive) => {
    if (!targetActorId) return;

    try {
      const dims = Array.isArray(dimensions) ? dimensions : [];
      const out = {};

      await Promise.all(
        dims.map(async (d) => {
          const rows = await listVportReviewsController({
            targetActorId,
            reviewType: d.key,
            limit: 200,
          });

          let count = 0;
          let sum = 0;
          for (const r of rows) {
            const n = Number(r?.rating);
            if (!Number.isFinite(n)) continue;
            count += 1;
            sum += n;
          }

          out[d.key] = {
            count,
            avg: count ? Number((sum / count).toFixed(2)) : null,
          };
        })
      );

      if (!alive()) return;
      setDimStats(out);
    } catch {
      if (!alive()) return;
      setDimStats({});
    }
  }, [targetActorId, JSON.stringify(dimensions || [])]);

  // Active list: show reviews for selected dimension tab
  useAsyncEffect(async (alive) => {
    if (!targetActorId) return;
    if (isServiceTab) return;

    if (tab === "overall") {
      setList([]);
      return;
    }

    setLoadingList(true);
    try {
      const rows = await listVportReviewsController({
        targetActorId,
        reviewType: tab,
        limit: 50,
      });
      if (!alive()) return;
      setList(rows);
    } catch {
      if (!alive()) return;
      setList([]);
    } finally {
      if (!alive()) return;
      setLoadingList(false);
    }
  }, [targetActorId, tab, isServiceTab]);

  // Unlimited system: no "my current week review".
  // Just reset composer defaults when switching dimension tabs.
  useAsyncEffect(async (alive) => {
    if (isServiceTab) return;

    setLoadingMyWeek(true);
    try {
      if (!alive()) return;

      // No preload. Clear "my review" state.
      setMyWeek(null);

      if (tab === "overall") {
        setRating(5);
        setBody("");
        return;
      }

      // When switching categories, reset input
      setRating(5);
      setBody("");
    } finally {
      if (!alive()) return;
      setLoadingMyWeek(false);
    }
  }, [targetActorId, viewerActorId, tab, isServiceTab, setRating, setBody]);

  const overallComputed = useMemo(() => {
    const dims = Array.isArray(dimensions) ? dimensions : [];
    return computeWeightedOverallFromDimensionStats(dimStats, dims);
  }, [dimStats, dimensions]);

  const overallCountComputed = useMemo(() => {
    const dims = Array.isArray(dimensions) ? dimensions : [];
    let m = 0;
    for (const d of dims) {
      const c = Number(dimStats?.[d.key]?.count ?? 0) || 0;
      if (c > m) m = c;
    }
    return m;
  }, [dimStats, dimensions]);

  return {
    dimStats,
    setDimStats,

    list,
    setList,
    loadingList,

    myWeek,
    setMyWeek,
    loadingMyWeek,

    overallComputed,
    overallCountComputed,
  };
}
