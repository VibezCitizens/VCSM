// src/features/profiles/kinds/vport/hooks/review/useVportReviews.js
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listVportReviewsController,
  createVportReviewController,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";

import {
  listServiceReviewsController,
  getServiceReviewStatsController,
  createServiceReviewController,
} from "@/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller";

import { getReviewDimensionsForVportType } from "@/features/profiles/kinds/vport/config/reviewDimensions.config";

import { useStoreReviewsFlow } from "@/features/profiles/kinds/vport/hooks/review/flows/useStoreReviewsFlow";
import { useServiceReviewsFlow } from "@/features/profiles/kinds/vport/hooks/review/flows/useServiceReviewsFlow";

export function useVportReviews({ targetActorId, viewerActorId, vportType }) {
  const dimensions = useMemo(() => {
    const dims = getReviewDimensionsForVportType(vportType);
    return (Array.isArray(dims) ? dims : []).filter((d) => d?.key !== "vibez");
  }, [vportType]);

  // ✅ default to overall (no vibez)
  const [tab, setTab] = useState("overall");
  const isServiceTab = tab === "services";

  useEffect(() => {
    const allowed = ["overall", ...dimensions.map((d) => d.key)];
    if (allowed.length === 1) allowed.push("services");
    else allowed.push("services");

    if (!allowed.includes(tab)) {
      setTab("overall");
    }
  }, [dimensions, tab]);

  const tabLabel = useMemo(() => {
    if (tab === "services") return "Services";
    if (tab === "overall") return "Overall";
    const d = dimensions.find((x) => x.key === tab);
    return d?.label ?? "Review";
  }, [tab, dimensions]);

  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const store = useStoreReviewsFlow({
    targetActorId,
    viewerActorId,
    tab,
    isServiceTab,
    setRating,
    setBody,
    dimensions,
  });

  const svc = useServiceReviewsFlow({
    targetActorId,
    viewerActorId,
    isServiceTab,
    setRating,
    setBody,
  });

  // ✅ cache lists per dimension so Overall can show "Top 3 recent comments"
  const [dimListCache, setDimListCache] = useState({});

  useEffect(() => {
    if (isServiceTab) return;
    if (tab === "overall") return;
    if (!Array.isArray(store.list)) return;

    setDimListCache((prev) => {
      const next = { ...(prev || {}) };
      next[tab] = store.list;
      return next;
    });
  }, [isServiceTab, tab, store.list]);

  const recentComments = useMemo(() => {
    const all = Object.values(dimListCache || {}).flatMap((v) => (Array.isArray(v) ? v : []));
    const withBody = all.filter((r) => r?.body);

    withBody.sort((a, b) => {
      const da = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
      const db = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
      return db - da;
    });

    // de-dupe by id if present
    const seen = new Set();
    const out = [];
    for (const r of withBody) {
      const id = r?.id ?? null;
      const key = id ? `id:${id}` : `t:${r?.createdAt ?? r?.created_at}:${r?.body}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
      if (out.length >= 3) break;
    }
    return out;
  }, [dimListCache]);

  const handleSave = useCallback(async () => {
    setMsg(null);
    setSaving(true);

    try {
      // ===========================
      // SERVICE REVIEWS (unlimited)
      // ===========================
      if (isServiceTab) {
        if (!viewerActorId || !svc.serviceId) return;

        const saved = await createServiceReviewController({
          viewerActorId,
          serviceId: svc.serviceId,
          rating,
          body,
        });

        svc.setMyServiceWeek(saved || null);
        setMsg("Submitted.");

        const [rows, s] = await Promise.all([
          listServiceReviewsController({ serviceId: svc.serviceId, limit: 50 }),
          getServiceReviewStatsController({ serviceId: svc.serviceId }),
        ]);

        svc.setServiceList(rows);
        svc.setServiceStats(s);

        setRating(5);
        setBody("");
        return;
      }

      // ===========================
      // STORE REVIEWS (dimensions)
      // ===========================
      if (tab === "overall") {
        // ✅ no writing here
        return;
      }

      if (!viewerActorId || !targetActorId) return;

      const saved = await createVportReviewController({
        viewerActorId,
        targetActorId,
        reviewType: tab,
        rating,
        body,
      });

      store.setMyWeek(saved || null);
      setMsg("Submitted.");

      const rows = await listVportReviewsController({
        targetActorId,
        reviewType: tab,
        limit: 50,
      });
      store.setList(rows);

      setRating(5);
      setBody("");
    } catch (e) {
      setMsg(e?.message ?? "Failed to submit.");
    } finally {
      setSaving(false);
    }
  }, [
    isServiceTab,
    viewerActorId,
    svc.serviceId,
    rating,
    body,
    tab,
    targetActorId,
    store,
    svc,
  ]);

  const displayAvg = useMemo(() => {
    if (isServiceTab) return svc.serviceStats.avg;
    if (tab === "overall") return store.overallComputed;
    const s = store.dimStats?.[tab];
    return s?.avg ?? null;
  }, [
    isServiceTab,
    svc.serviceStats.avg,
    tab,
    store.overallComputed,
    store.dimStats,
  ]);

  const displayCnt = useMemo(() => {
    if (isServiceTab) return svc.serviceStats.count;
    if (tab === "overall") return store.overallCountComputed;
    const s = store.dimStats?.[tab];
    return s?.count ?? 0;
  }, [
    isServiceTab,
    svc.serviceStats.count,
    tab,
    store.overallCountComputed,
    store.dimStats,
  ]);

  const activeList = isServiceTab ? svc.serviceList : store.list;
  const loadingActiveList = isServiceTab ? svc.loadingServiceList : store.loadingList;

  const myLoading = isServiceTab ? svc.loadingMyServiceWeek : store.loadingMyWeek;
  const myExists = isServiceTab ? !!svc.myServiceWeek : !!store.myWeek;

  const selectedServiceName = svc.selectedService?.name ?? null;

  return {
    dimensions,

    tab,
    setTab,
    tabLabel,
    isServiceTab,

    displayAvg,
    displayCnt,

    // ✅ expose computed stats for Overall dashboard
    overallAvg: store.overallComputed ?? null,
    overallCount: store.overallCountComputed ?? 0,
    dimStats: store.dimStats ?? {},

    // ✅ expose cached comments
    recentComments,

    services: svc.services,
    loadingServices: svc.loadingServices,
    serviceId: svc.serviceId,
    setServiceId: svc.setServiceId,
    selectedServiceName,

    activeList,
    loadingActiveList,

    myLoading,
    myExists,

    rating,
    setRating,
    body,
    setBody,

    saving,
    msg,
    handleSave,
  };
}
