import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import {
  ctrlAssertReviewTargetActor,
  ctrlGetOfficialStats,
  ctrlGetReviewFormConfig,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";
import * as ServiceCtrl from "@/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller";
import {
  computeDimStatsFromReviews,
  normalizeInput,
  pickRecentComments,
  round4,
  safeNum,
} from "@/features/profiles/kinds/vport/hooks/review/useVportReviews.helpers";
import { useVportReviewList } from "@/features/profiles/kinds/vport/hooks/review/useVportReviewList";
import { useVportReviewMine } from "@/features/profiles/kinds/vport/hooks/review/useVportReviewMine";

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
  const [error, setError] = useState(null);

  const mountedRef = useRef(false);
  const inFlightCoreRef = useRef(false);
  const inFlightServicesRef = useRef(false);

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

  const list = useVportReviewList({ targetActorId, tab, serviceId, mountedRef, setError });

  const mine = useVportReviewMine({
    authorActorId,
    targetActorId,
    canReview,
    identity,
    mountedRef,
    setActiveList: list.setActiveList,
    setError,
    loadActiveList: list.loadActiveList,
    loadCore,
  });

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
    list.loadActiveList();
  }, [list.loadActiveList]);

  useEffect(() => {
    mine.loadMyReview();
  }, [mine.loadMyReview]);

  const overallAverage = useMemo(() => round4(officialStats?.overallAverage ?? officialStats?.overall_average), [officialStats]);
  const totalReviews = useMemo(() => safeNum(officialStats?.totalReviews ?? officialStats?.total_reviews, 0), [officialStats]);
  const recentComments = useMemo(() => pickRecentComments(list.activeList, 3), [list.activeList]);
  const dimStats = useMemo(() => computeDimStatsFromReviews(list.activeList, dimensions), [list.activeList, dimensions]);

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
    activeList: list.activeList,
    setActiveList: list.setActiveList,
    loadingActiveList: list.loadingActiveList,
    hasMore: list.hasMore,
    loadingMore: list.loadingMore,
    loadMore: list.loadMore,
    recentComments,
    dimStats,
    myLoading: mine.myLoading,
    myReview: mine.myReview,
    setMyReview: mine.setMyReview,
    myExists: mine.myExists,
    setMyExists: mine.setMyExists,
    isEditing: mine.isEditing,
    isDeleting: mine.isDeleting,
    startEdit: mine.startEdit,
    cancelEdit: mine.cancelEdit,
    deleteMyReview: mine.deleteMyReview,
    error,
    canReview,
    isServiceTab,
    tabLabel,
    viewerActorId,
    authorActorId,
    submitReview: mine.submitReview,
    reload: list.loadActiveList,
    reloadStats: loadCore,
  };
}
