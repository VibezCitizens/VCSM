// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\hooks\review\useVportReviews.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";

import {
  ctrlGetMyActiveReview,
  ctrlGetOfficialStats,
  ctrlGetReviewFormConfig,
  ctrlListReviews,
  ctrlSubmitReview,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";
import {
  computeDimStatsFromReviews,
  normalizeInput,
  pickRecentComments,
  round4,
  safeNum,
} from "@/features/profiles/kinds/vport/hooks/review/useVportReviews.helpers";

// Optional (only if you have it; hook will gracefully no-op if missing)
import * as ServiceCtrl from "@/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller";

/* ============================================================
   Hook (legacy UI contract: tab/services/overall/composer)
   - fixes "freeze" by removing dependency loops
   - removes double-fetch of reviews for "my review"
   ============================================================ */

export function useVportReviews(input) {
  const { identity } = useIdentity();
  const authorActorId = identity?.actorId ?? null;

  const { targetActorId, viewerActorId } = useMemo(() => normalizeInput(input), [input]);

  /* ---------------- UI state ---------------- */
  const [tab, setTab] = useState("overall");

  // services
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceId, setServiceId] = useState(null);

  // config + stats
  const [dimensions, setDimensions] = useState([]);
  const [officialStats, setOfficialStats] = useState(null);

  // active list
  const [activeList, setActiveList] = useState([]);
  const [loadingActiveList, setLoadingActiveList] = useState(true);

  // my composer state
  const [myLoading, setMyLoading] = useState(false);
  const [myExists, setMyExists] = useState(false);

  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // generic
  const [error, setError] = useState(null);

  /* ---------------- loop safety ---------------- */
  const mountedRef = useRef(false);
  const inFlightCoreRef = useRef(false);
  const inFlightServicesRef = useRef(false);
  const inFlightListRef = useRef(false);
  const inFlightMyRef = useRef(false);

  /* ---------------- derived ---------------- */
  const canReview = useMemo(() => {
    return Boolean(authorActorId) && Boolean(targetActorId) && identity?.kind === "user";
  }, [authorActorId, targetActorId, identity?.kind]);

  const isServiceTab = useMemo(() => tab === "services", [tab]);

  const selectedService = useMemo(() => {
    if (!serviceId) return null;
    return (services || []).find((s) => String(s?.id) === String(serviceId)) ?? null;
  }, [services, serviceId]);

  const tabLabel = useMemo(() => {
    if (tab === "overall") return "Overall";
    if (tab === "services") return selectedService?.name ?? "Services";
    const d = (dimensions || []).find((x) => String(x?.dimensionKey) === String(tab));
    return d?.label ?? "Reviews";
  }, [tab, selectedService, dimensions]);

  /* ============================================================
     Load core (dimensions + official stats)
     ============================================================ */

  const loadCore = useCallback(async () => {
    if (!targetActorId) return;
    if (inFlightCoreRef.current) return;
    inFlightCoreRef.current = true;

    setError(null);

    try {
      const [dims, st] = await Promise.all([
        ctrlGetReviewFormConfig(targetActorId),
        ctrlGetOfficialStats(targetActorId),
      ]);

      if (!mountedRef.current) return;

      const normalizedDims = (Array.isArray(dims) ? dims : [])
        .map((d) => ({
          vportType: d?.vportType ?? d?.vport_type ?? null,
          dimensionKey: d?.dimensionKey ?? d?.dimension_key ?? d?.key ?? null,
          label: d?.label ?? null,
          weight: d?.weight ?? 1,
          sortOrder: d?.sortOrder ?? d?.sort_order ?? 0,
        }))
        .filter((d) => d.dimensionKey);

      setDimensions(normalizedDims);
      setOfficialStats(st ?? null);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e);
    } finally {
      inFlightCoreRef.current = false;
    }
  }, [targetActorId]);

  // keep tab valid after dimensions load (NO dependency loop in loadCore)
  useEffect(() => {
    if (!dimensions?.length) return;

    if (tab !== "overall" && tab !== "services") {
      const ok = dimensions.some((d) => String(d.dimensionKey) === String(tab));
      if (!ok) setTab("overall");
    }
  }, [dimensions, tab]);

  /* ============================================================
     Load services (optional)
     ============================================================ */

  const loadServices = useCallback(async () => {
    if (!targetActorId) return;

    const fn =
      ServiceCtrl?.ctrlListReviewServices ||
      ServiceCtrl?.ctrlListServicesForReviews ||
      null;

    if (!fn) {
      setServices([]);
      return;
    }

    if (inFlightServicesRef.current) return;
    inFlightServicesRef.current = true;

    setLoadingServices(true);

    try {
      const list = await fn(targetActorId);

      if (!mountedRef.current) return;

      const normalized = (Array.isArray(list) ? list : [])
        .map((s) => ({
          id: s?.id ?? s?.service_id ?? s?.serviceId ?? null,
          name: s?.name ?? s?.label ?? null,
        }))
        .filter((x) => x.id && x.name);

      setServices(normalized);

      if (serviceId && !normalized.some((x) => String(x.id) === String(serviceId))) {
        setServiceId(null);
      }
    } catch {
      if (!mountedRef.current) return;
      setServices([]);
    } finally {
      if (mountedRef.current) setLoadingServices(false);
      inFlightServicesRef.current = false;
    }
  }, [targetActorId, serviceId]);

  /* ============================================================
     Load active list (tab-aware)
     ============================================================ */

  const loadActiveList = useCallback(async () => {
    if (!targetActorId) return;
    if (inFlightListRef.current) return;
    inFlightListRef.current = true;

    setLoadingActiveList(true);
    setError(null);

    try {
      let list = await ctrlListReviews(targetActorId, 50);
      list = Array.isArray(list) ? list : [];

      if (tab === "services") {
        const fn =
          ServiceCtrl?.ctrlListServiceReviews ||
          ServiceCtrl?.ctrlListReviewsForService ||
          null;

        if (fn && serviceId) {
          const svcList = await fn({ targetActorId, serviceId, limit: 50 });
          list = Array.isArray(svcList) ? svcList : [];
        } else {
          list = serviceId ? list : [];
        }
      }

      if (tab !== "overall" && tab !== "services") {
        const dimKey = tab;
        list = list.filter((r) => {
          const ratings = r?.ratings ?? [];
          if (!Array.isArray(ratings)) return false;
          return ratings.some((rr) => String(rr?.dimensionKey) === String(dimKey));
        });
      }

      if (!mountedRef.current) return;
      setActiveList(list);
    } catch (e) {
      if (!mountedRef.current) return;
      setActiveList([]);
      setError(e);
    } finally {
      if (mountedRef.current) setLoadingActiveList(false);
      inFlightListRef.current = false;
    }
  }, [targetActorId, tab, serviceId]);

  /* ============================================================
     Load my review (fast)
     ============================================================ */

  const loadMy = useCallback(async () => {
    if (!targetActorId || !authorActorId) {
      setMyLoading(false);
      setMyExists(false);
      return;
    }

    if (inFlightMyRef.current) return;
    inFlightMyRef.current = true;

    setMyLoading(true);

    try {
      const mine = await ctrlGetMyActiveReview(targetActorId, authorActorId);

      if (!mountedRef.current) return;

      setMyExists(Boolean(mine));

      if (mine) {
        const overall = safeNum(mine?.overallRating);
        setRating(overall != null ? Math.max(1, Math.min(5, Math.round(overall))) : 5);
        setBody(String(mine?.body ?? ""));
      }
    } catch {
      if (!mountedRef.current) return;
      setMyExists(false);
    } finally {
      if (mountedRef.current) setMyLoading(false);
      inFlightMyRef.current = false;
    }
  }, [targetActorId, authorActorId]);

  /* ============================================================
     Save handler (composer)
     ============================================================ */

  const handleSave = useCallback(async () => {
    if (!canReview) {
      setMsg("You must be signed in as a user to review.");
      return;
    }

    setSaving(true);
    setError(null);
    setMsg(null);

    try {
      const dimKeys = (dimensions || []).map((d) => d.dimensionKey).filter(Boolean);

      let ratingsPayload = [];

      if (tab !== "overall" && tab !== "services") {
        ratingsPayload = [{ dimensionKey: tab, rating }];
      } else {
        const preferred =
          dimKeys.includes("overall_experience")
            ? "overall_experience"
            : dimKeys[0] ?? "service_quality";

        ratingsPayload = [{ dimensionKey: preferred, rating }];
      }

      await ctrlSubmitReview({
        targetActorId,
        authorActorId,
        body,
        ratings: ratingsPayload,
      });

      if (!mountedRef.current) return;

      setMsg("Saved.");
      await Promise.all([loadCore(), loadActiveList(), loadMy()]);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e);
      setMsg(e?.message ?? "Failed to save.");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [
    canReview,
    targetActorId,
    authorActorId,
    body,
    rating,
    tab,
    dimensions,
    loadCore,
    loadActiveList,
    loadMy,
  ]);

  /* ============================================================
     Overall dashboard derived stats
     ============================================================ */

  const overallAvg = useMemo(() => {
    const v = safeNum(officialStats?.officialOverallAvg ?? officialStats?.official_overall_avg);
    return v != null ? round4(v) : null;
  }, [officialStats]);

  const overallCount = useMemo(() => {
    const v = officialStats?.verifiedReviewCount ?? officialStats?.verified_review_count ?? 0;
    return Number(v) || 0;
  }, [officialStats]);

  const dimStats = useMemo(() => computeDimStatsFromReviews(activeList), [activeList]);
  const recentComments = useMemo(() => pickRecentComments(activeList, 6), [activeList]);

  const displayAvg = useMemo(() => {
    if (tab === "overall") return overallAvg;
    const rows = Array.isArray(activeList) ? activeList : [];
    const nums = rows
      .map((r) => safeNum(r?.overallRating))
      .filter((x) => x != null);

    if (!nums.length) return null;
    return round4(nums.reduce((a, b) => a + b, 0) / nums.length);
  }, [tab, overallAvg, activeList]);

  const displayCnt = useMemo(() => {
    if (tab === "overall") return overallCount;
    return Array.isArray(activeList) ? activeList.length : 0;
  }, [tab, overallCount, activeList]);

  /* ============================================================
     Effects
     ============================================================ */

  useEffect(() => {
    mountedRef.current = true;

    if (!targetActorId) {
      setLoadingActiveList(false);
      return () => {
        mountedRef.current = false;
      };
    }

    (async () => {
      await loadCore();
      await loadServices();
      await Promise.all([loadActiveList(), loadMy()]);
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [targetActorId, loadCore, loadServices, loadActiveList, loadMy]);

  // reload active list on tab/service changes (list only)
  useEffect(() => {
    if (!targetActorId) return;
    loadActiveList();
  }, [targetActorId, tab, serviceId, loadActiveList]);

  return {
    viewerActorId,

    // tab contract
    tab,
    setTab,
    tabLabel,
    isServiceTab,

    // services contract
    services,
    loadingServices,
    serviceId,
    setServiceId,
    selectedService,

    // lists
    activeList,
    loadingActiveList,

    // overall dashboard contract
    overallAvg,
    overallCount,
    dimStats,
    recentComments,

    // composer contract
    myLoading,
    myExists,
    rating,
    setRating,
    body,
    setBody,
    saving,
    handleSave,
    msg,

    // header display
    displayAvg,
    displayCnt,

    // misc
    canReview,
    error,

    // legacy-ish aliases
    loading: loadingActiveList,
    reviews: activeList,
    stats: officialStats,
    dimensions,
    refresh: async () => {
      await Promise.all([loadCore(), loadServices(), loadActiveList(), loadMy()]);
    },
  };
}
