import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";

import {
  ctrlAssertReviewTargetActor,
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

import * as ServiceCtrl from "@/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller";

export function useVportReviews(input) {
  const { identity } = useIdentity();
  const authorActorId = identity?.actorId ?? null;

  const { targetActorId, viewerActorId } = useMemo(() => normalizeInput(input), [input]);

  const [tab, setTab] = useState("overall");
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceId, setServiceId] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [officialStats, setOfficialStats] = useState(null);
  const [activeList, setActiveList] = useState([]);
  const [loadingActiveList, setLoadingActiveList] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [myExists, setMyExists] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const mountedRef = useRef(false);
  const inFlightCoreRef = useRef(false);
  const inFlightServicesRef = useRef(false);
  const inFlightListRef = useRef(false);
  const inFlightMyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!targetActorId) return;

      try {
        await ctrlAssertReviewTargetActor(targetActorId);
        if (!cancelled) setError(null);
      } catch (nextError) {
        if (!cancelled) setError(nextError);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetActorId]);

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
    const dimension = (dimensions || []).find((item) => String(item?.dimensionKey) === String(tab));
    return dimension?.label ?? "Reviews";
  }, [tab, selectedService, dimensions]);

  const loadCore = useCallback(async () => {
    if (!targetActorId) return;
    if (inFlightCoreRef.current) return;
    inFlightCoreRef.current = true;

    setError(null);

    try {
      const [dims, stats] = await Promise.all([
        ctrlGetReviewFormConfig(targetActorId),
        ctrlGetOfficialStats(targetActorId),
      ]);

      if (!mountedRef.current) return;

      const normalizedDims = (Array.isArray(dims) ? dims : [])
        .map((dimension) => ({
          vportType: dimension?.vportType ?? dimension?.vport_type ?? null,
          dimensionKey: dimension?.dimensionKey ?? dimension?.dimension_key ?? dimension?.key ?? null,
          label: dimension?.label ?? null,
          weight: dimension?.weight ?? 1,
          sortOrder: dimension?.sortOrder ?? dimension?.sort_order ?? 0,
        }))
        .filter((dimension) => dimension.dimensionKey);

      setDimensions(normalizedDims);
      setOfficialStats(stats ?? null);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(nextError);
    } finally {
      inFlightCoreRef.current = false;
    }
  }, [targetActorId]);

  useEffect(() => {
    if (!dimensions?.length) return;

    if (tab !== "overall" && tab !== "services") {
      const hasTab = dimensions.some((dimension) => String(dimension.dimensionKey) === String(tab));
      if (!hasTab) setTab("overall");
    }
  }, [dimensions, tab]);

  const loadServices = useCallback(async () => {
    if (!targetActorId) return;

    const fn = ServiceCtrl?.ctrlListReviewServices || ServiceCtrl?.ctrlListServicesForReviews || null;
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
        .map((service) => ({
          id: service?.id ?? service?.service_id ?? service?.serviceId ?? null,
          name: service?.name ?? service?.label ?? null,
        }))
        .filter((service) => service.id && service.name);

      setServices(normalized);

      if (serviceId && !normalized.some((service) => String(service.id) === String(serviceId))) {
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
        const fn = ServiceCtrl?.ctrlListServiceReviews || ServiceCtrl?.ctrlListReviewsForService || null;

        if (fn && serviceId) {
          const serviceList = await fn({ targetActorId, serviceId, limit: 50 });
          list = Array.isArray(serviceList) ? serviceList : [];
        } else {
          list = serviceId ? list : [];
        }
      }

      if (tab !== "overall" && tab !== "services") {
        list = list.filter((review) =>
          Array.isArray(review?.ratings)
            ? review.ratings.some((ratingRow) => String(ratingRow?.dimensionKey) === String(tab))
            : false
        );
      }

      if (!mountedRef.current) return;
      setActiveList(list);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(nextError);
      setActiveList([]);
    } finally {
      if (mountedRef.current) setLoadingActiveList(false);
      inFlightListRef.current = false;
    }
  }, [targetActorId, tab, serviceId]);

  const loadMyReview = useCallback(async () => {
    if (!authorActorId || !targetActorId || !canReview) {
      setMyExists(false);
      setRating(5);
      setBody("");
      return;
    }

    if (inFlightMyRef.current) return;
    inFlightMyRef.current = true;
    setMyLoading(true);

    try {
      const mine = await ctrlGetMyActiveReview(targetActorId, authorActorId);
      if (!mountedRef.current) return;

      setMyExists(Boolean(mine));
      setBody(mine?.body ?? "");

      const firstRating = Array.isArray(mine?.ratings) ? safeNum(mine.ratings[0]?.rating, 5) : 5;
      setRating(firstRating);
    } catch {
      if (!mountedRef.current) return;
      setMyExists(false);
      setBody("");
      setRating(5);
    } finally {
      if (mountedRef.current) setMyLoading(false);
      inFlightMyRef.current = false;
    }
  }, [authorActorId, targetActorId, canReview]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    loadActiveList();
  }, [loadActiveList]);

  useEffect(() => {
    loadMyReview();
  }, [loadMyReview]);

  const submit = useCallback(async () => {
    if (!canReview) return null;

    setSaving(true);
    setMsg(null);
    setError(null);

    try {
      const ratings = [];

      if (tab === "overall") {
        const key = dimensions?.[0]?.dimensionKey ?? "overall";
        ratings.push({ dimensionKey: key, rating });
      } else if (tab === "services" && serviceId) {
        ratings.push({ dimensionKey: "service", rating, serviceId });
      } else {
        ratings.push({ dimensionKey: tab, rating });
      }

      const saved = await ctrlSubmitReview({
        targetActorId,
        authorActorId,
        body,
        ratings,
      });

      if (!mountedRef.current) return saved;

      setMyExists(true);
      setMsg("Saved");
      await Promise.all([loadActiveList(), loadMyReview(), loadCore()]);
      return saved;
    } catch (nextError) {
      if (mountedRef.current) setError(nextError);
      throw nextError;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [
    authorActorId,
    body,
    canReview,
    dimensions,
    loadActiveList,
    loadCore,
    loadMyReview,
    rating,
    serviceId,
    tab,
    targetActorId,
  ]);

  const overallAverage = useMemo(() => round4(officialStats?.overallAverage ?? officialStats?.overall_average), [officialStats]);
  const totalReviews = useMemo(() => safeNum(officialStats?.totalReviews ?? officialStats?.total_reviews, 0), [officialStats]);
  const recentComments = useMemo(() => pickRecentComments(activeList, 3), [activeList]);
  const dimStats = useMemo(() => computeDimStatsFromReviews(activeList, dimensions), [activeList, dimensions]);

  return {
    tab,
    setTab,
    services,
    loadingServices,
    serviceId,
    setServiceId,
    selectedService,
    dimensions,
    officialStats,
    overallAverage,
    totalReviews,
    activeList,
    loadingActiveList,
    recentComments,
    dimStats,
    myLoading,
    myExists,
    rating,
    setRating,
    body,
    setBody,
    saving,
    msg,
    setMsg,
    error,
    canReview,
    isServiceTab,
    tabLabel,
    viewerActorId,
    submit,
    reload: loadActiveList,
  };
}
