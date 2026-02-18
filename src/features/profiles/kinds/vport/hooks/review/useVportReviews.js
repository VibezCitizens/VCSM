// src/features/profiles/kinds/vport/screens/views/tabs/review/hooks/useVportReviews.js
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listVportReviewsController,
  getVportReviewStatsController,
  getMyCurrentWeekVportReviewController,
  saveMyCurrentWeekVportReviewController,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";

import {
  listVportServicesController,
  listServiceReviewsController,
  getServiceReviewStatsController,
  getMyCurrentWeekServiceReviewController,
  saveMyCurrentWeekServiceReviewController,
} from "@/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller";

/**
 * Small helper to avoid repeating the "alive" pattern everywhere.
 * - runs async function
 * - provides `alive()` checker
 */
function useAsyncEffect(effect, deps) {
  useEffect(() => {
    let alive = true;
    const aliveFn = () => alive;

    (async () => {
      try {
        await effect(aliveFn);
      } catch {
        // let callers handle inside effect if they want;
        // swallow to avoid unhandled promise warnings
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ============================================================
   STORE REVIEWS (overall | food)
============================================================ */

function useStoreReviewsFlow({ targetActorId, viewerActorId, tab, isServiceTab, setRating, setBody }) {
  const [stats, setStats] = useState({
    overall: { count: 0, avg: null },
    food: { count: 0, avg: null },
  });

  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [myWeek, setMyWeek] = useState(null);
  const [loadingMyWeek, setLoadingMyWeek] = useState(false);

  // stats (overall + food)
  useAsyncEffect(async (alive) => {
    if (!targetActorId) return;

    try {
      const s = await getVportReviewStatsController({ targetActorId });
      if (!alive()) return;
      setStats(s);
    } catch (e) {
      if (!alive()) return;
      setStats({ overall: { count: 0, avg: null }, food: { count: 0, avg: null } });
    }
  }, [targetActorId]);

  // list for current store tab
  useAsyncEffect(async (alive) => {
    if (!targetActorId) return;
    if (isServiceTab) return;

    setLoadingList(true);
    try {
      const rows = await listVportReviewsController({
        targetActorId,
        reviewType: tab,
        limit: 50,
      });
      if (!alive()) return;
      setList(rows);
    } catch (e) {
      if (!alive()) return;
      setList([]);
    } finally {
      if (!alive()) return;
      setLoadingList(false);
    }
  }, [targetActorId, tab, isServiceTab]);

  // my current week review for store tab
  useAsyncEffect(async (alive) => {
    if (isServiceTab) return;

    if (!targetActorId || !viewerActorId) {
      setMyWeek(null);
      return;
    }

    setLoadingMyWeek(true);
    try {
      const r = await getMyCurrentWeekVportReviewController({
        viewerActorId,
        targetActorId,
        reviewType: tab,
      });
      if (!alive()) return;
      setMyWeek(r || null);
      setRating(r?.rating ?? 5);
      setBody(r?.body ?? "");
    } catch (e) {
      if (!alive()) return;
      setMyWeek(null);
    } finally {
      if (!alive()) return;
      setLoadingMyWeek(false);
    }
  }, [targetActorId, viewerActorId, tab, isServiceTab, setRating, setBody]);

  return {
    stats,
    setStats,
    list,
    setList,
    loadingList,
    myWeek,
    setMyWeek,
    loadingMyWeek,
  };
}

/* ============================================================
   SERVICE REVIEWS (services tab)
============================================================ */

function useServiceReviewsFlow({ targetActorId, viewerActorId, isServiceTab, setRating, setBody }) {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceId, setServiceId] = useState(null);

  const [serviceStats, setServiceStats] = useState({ count: 0, avg: null });
  const [serviceList, setServiceList] = useState([]);
  const [loadingServiceList, setLoadingServiceList] = useState(false);

  const [myServiceWeek, setMyServiceWeek] = useState(null);
  const [loadingMyServiceWeek, setLoadingMyServiceWeek] = useState(false);

  const selectedService = useMemo(() => {
    if (!isServiceTab) return null;
    return services.find((s) => s.id === serviceId) ?? null;
  }, [isServiceTab, services, serviceId]);

  // catalog
  useAsyncEffect(async (alive) => {
    if (!targetActorId) return;
    if (!isServiceTab) return;

    setLoadingServices(true);
    try {
      const rows = await listVportServicesController({ targetActorId, limit: 200 });
      if (!alive()) return;

      const safe = Array.isArray(rows) ? rows : [];
      setServices(safe);

      setServiceId((prev) => {
        if (prev && safe.some((x) => x.id === prev)) return prev;
        return safe?.[0]?.id ?? null;
      });
    } catch (e) {
      if (!alive()) return;
      setServices([]);
      setServiceId(null);
    } finally {
      if (!alive()) return;
      setLoadingServices(false);
    }
  }, [targetActorId, isServiceTab]);

  // stats
  useAsyncEffect(async (alive) => {
    if (!isServiceTab) return;
    if (!serviceId) return;

    try {
      const s = await getServiceReviewStatsController({ serviceId });
      if (!alive()) return;
      setServiceStats(s);
    } catch (e) {
      if (!alive()) return;
      setServiceStats({ count: 0, avg: null });
    }
  }, [isServiceTab, serviceId]);

  // list
  useAsyncEffect(async (alive) => {
    if (!isServiceTab) return;
    if (!serviceId) return;

    setLoadingServiceList(true);
    try {
      const rows = await listServiceReviewsController({ serviceId, limit: 50 });
      if (!alive()) return;
      setServiceList(rows);
    } catch (e) {
      if (!alive()) return;
      setServiceList([]);
    } finally {
      if (!alive()) return;
      setLoadingServiceList(false);
    }
  }, [isServiceTab, serviceId]);

  // my week
  useAsyncEffect(async (alive) => {
    if (!isServiceTab) return;

    if (!viewerActorId || !serviceId) {
      setMyServiceWeek(null);
      return;
    }

    setLoadingMyServiceWeek(true);
    try {
      const r = await getMyCurrentWeekServiceReviewController({
        viewerActorId,
        serviceId,
      });
      if (!alive()) return;
      setMyServiceWeek(r || null);
      setRating(r?.rating ?? 5);
      setBody(r?.body ?? "");
    } catch (e) {
      if (!alive()) return;
      setMyServiceWeek(null);
    } finally {
      if (!alive()) return;
      setLoadingMyServiceWeek(false);
    }
  }, [isServiceTab, viewerActorId, serviceId, setRating, setBody]);

  return {
    services,
    loadingServices,
    serviceId,
    setServiceId,
    selectedService,

    serviceStats,
    setServiceStats,
    serviceList,
    setServiceList,
    loadingServiceList,

    myServiceWeek,
    setMyServiceWeek,
    loadingMyServiceWeek,
  };
}

/* ============================================================
   PUBLIC HOOK
============================================================ */

export function useVportReviews({ targetActorId, viewerActorId }) {
  const [tab, setTab] = useState("overall"); // overall | food | services
  const isServiceTab = tab === "services";

  const tabLabel = useMemo(() => {
    if (tab === "food") return "Food";
    if (tab === "services") return "Services";
    return "Overall";
  }, [tab]);

  // shared composer
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
  });

  const svc = useServiceReviewsFlow({
    targetActorId,
    viewerActorId,
    isServiceTab,
    setRating,
    setBody,
  });

  const handleSave = useCallback(async () => {
    setMsg(null);
    setSaving(true);

    try {
      if (isServiceTab) {
        if (!viewerActorId || !svc.serviceId) return;

        const saved = await saveMyCurrentWeekServiceReviewController({
          viewerActorId,
          serviceId: svc.serviceId,
          rating,
          body,
        });

        svc.setMyServiceWeek(saved || null);
        setMsg("Saved for this week.");

        const [rows, s] = await Promise.all([
          listServiceReviewsController({ serviceId: svc.serviceId, limit: 50 }),
          getServiceReviewStatsController({ serviceId: svc.serviceId }),
        ]);

        svc.setServiceList(rows);
        svc.setServiceStats(s);
      } else {
        if (!viewerActorId || !targetActorId) return;

        const saved = await saveMyCurrentWeekVportReviewController({
          viewerActorId,
          targetActorId,
          reviewType: tab,
          rating,
          body,
        });

        store.setMyWeek(saved || null);
        setMsg("Saved for this week.");

        const [rows, s] = await Promise.all([
          listVportReviewsController({ targetActorId, reviewType: tab, limit: 50 }),
          getVportReviewStatsController({ targetActorId }),
        ]);

        store.setList(rows);
        store.setStats(s);
      }
    } catch (e) {
      setMsg(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [isServiceTab, viewerActorId, svc.serviceId, rating, body, targetActorId, tab, store, svc]);

  const avgForStoreTab = tab === "food" ? store.stats.food.avg : store.stats.overall.avg;
  const cntForStoreTab = tab === "food" ? store.stats.food.count : store.stats.overall.count;

  const displayAvg = isServiceTab ? svc.serviceStats.avg : avgForStoreTab;
  const displayCnt = isServiceTab ? svc.serviceStats.count : cntForStoreTab;

  const activeList = isServiceTab ? svc.serviceList : store.list;
  const loadingActiveList = isServiceTab ? svc.loadingServiceList : store.loadingList;

  const myLoading = isServiceTab ? svc.loadingMyServiceWeek : store.loadingMyWeek;
  const myExists = isServiceTab ? !!svc.myServiceWeek : !!store.myWeek;

  return {
    tab,
    setTab,
    tabLabel,
    isServiceTab,

    stats: store.stats,
    services: svc.services,
    loadingServices: svc.loadingServices,
    serviceId: svc.serviceId,
    setServiceId: svc.setServiceId,
    selectedService: svc.selectedService,

    displayAvg,
    displayCnt,

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
