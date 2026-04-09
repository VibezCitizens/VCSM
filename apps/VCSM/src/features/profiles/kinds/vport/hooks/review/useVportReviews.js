import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";

import {
  ctrlAssertReviewTargetActor,
  ctrlDeleteMyReview,
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
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [myLoading, setMyLoading] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [myExists, setMyExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      const result = await ctrlListReviews(targetActorId, { limit: 25 });
      let list = Array.isArray(result?.reviews) ? result.reviews : (Array.isArray(result) ? result : []);

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
      setHasMore(result?.hasMore ?? false);
      setNextCursor(result?.nextCursor ?? null);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(nextError);
      setActiveList([]);
      setHasMore(false);
      setNextCursor(null);
    } finally {
      if (mountedRef.current) setLoadingActiveList(false);
      inFlightListRef.current = false;
    }
  }, [targetActorId, tab, serviceId]);

  const loadMore = useCallback(async () => {
    if (!targetActorId || !hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);

    try {
      const result = await ctrlListReviews(targetActorId, { limit: 25, cursor: nextCursor });
      let moreList = Array.isArray(result?.reviews) ? result.reviews : [];

      if (tab !== "overall" && tab !== "services") {
        moreList = moreList.filter((review) =>
          Array.isArray(review?.ratings)
            ? review.ratings.some((ratingRow) => String(ratingRow?.dimensionKey) === String(tab))
            : false
        );
      }

      if (!mountedRef.current) return;
      setActiveList((prev) => [...prev, ...moreList]);
      setHasMore(result?.hasMore ?? false);
      setNextCursor(result?.nextCursor ?? null);
    } catch {
      // silently fail load-more — list stays with current items
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [targetActorId, hasMore, nextCursor, loadingMore, tab]);

  const loadMyReview = useCallback(async () => {
    if (!authorActorId || !targetActorId || !canReview) {
      setMyReview(null);
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

      setMyReview(mine ?? null);
      setMyExists(Boolean(mine));

      if (!isEditing) {
        setBody(mine?.body ?? "");
        const firstRating = Array.isArray(mine?.ratings) ? safeNum(mine.ratings[0]?.rating, 5) : 5;
        setRating(firstRating);
      }
    } catch {
      if (!mountedRef.current) return;
      setMyReview(null);
      setMyExists(false);
      setBody("");
      setRating(5);
    } finally {
      if (mountedRef.current) setMyLoading(false);
      inFlightMyRef.current = false;
    }
  }, [authorActorId, targetActorId, canReview, isEditing]);

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

    const ratings = [];

    if (tab === "overall") {
      const key = dimensions?.[0]?.dimensionKey ?? "overall";
      ratings.push({ dimensionKey: key, rating });
    } else if (tab === "services" && serviceId) {
      ratings.push({ dimensionKey: "service", rating, serviceId });
    } else {
      ratings.push({ dimensionKey: tab, rating });
    }

    // --- Optimistic UI: build temporary review card ---
    const now = new Date().toISOString();
    const optimisticId = "optimistic-" + crypto.randomUUID();

    const optimisticReview = {
      id: optimisticId,
      targetActorId,
      authorActorId,
      body: body ?? "",
      overallRating: rating,
      ratings: ratings.map((r) => ({
        dimensionKey: r.dimensionKey,
        rating: r.rating,
      })),
      reviewMode: "neutral",
      verificationStatus: "unverified",
      ratingScale: 5,
      createdAt: now,
      updatedAt: now,
      reviewActivityAt: now,
      isDeleted: false,
      deletedAt: null,
      authorDisplayName: identity?.displayName ?? "You",
      authorUsername: identity?.username ?? "",
      authorAvatarUrl: identity?.avatarUrl ?? identity?.avatar ?? "",
      isOptimistic: true,
    };

    // Prepend optimistic review to list and mark as existing
    setActiveList((prev) => [optimisticReview, ...prev]);
    setMyReview(optimisticReview);
    setMyExists(true);

    try {
      const saved = await ctrlSubmitReview({
        targetActorId,
        authorActorId,
        body,
        ratings,
      });

      if (!mountedRef.current) return saved;

      // --- Reconciliation: replace optimistic with real review ---
      setActiveList((prev) =>
        prev.map((r) =>
          r.id === optimisticId ? { ...saved, isOptimistic: false } : r
        )
      );
      setMyReview(saved);
      setMsg("Saved");

      // Reload stats (non-blocking)
      loadCore().catch(() => {});

      return saved;
    } catch (nextError) {
      if (!mountedRef.current) throw nextError;

      // --- Rollback: remove optimistic review ---
      setActiveList((prev) => prev.filter((r) => r.id !== optimisticId));
      setMyReview(null);
      setMyExists(false);
      setError(nextError);
      throw nextError;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [
    authorActorId,
    body,
    canReview,
    dimensions,
    identity,
    loadCore,
    rating,
    serviceId,
    tab,
    targetActorId,
  ]);

  const overallAverage = useMemo(() => round4(officialStats?.overallAverage ?? officialStats?.overall_average), [officialStats]);
  const totalReviews = useMemo(() => safeNum(officialStats?.totalReviews ?? officialStats?.total_reviews, 0), [officialStats]);
  const recentComments = useMemo(() => pickRecentComments(activeList, 3), [activeList]);
  const dimStats = useMemo(() => computeDimStatsFromReviews(activeList, dimensions), [activeList, dimensions]);

  const startEdit = useCallback(() => {
    if (!myReview) return;
    setIsEditing(true);
    setBody(myReview.body ?? "");
  }, [myReview]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setBody("");
    setRating(5);
  }, []);

  const deleteMyReview = useCallback(async () => {
    if (!myReview?.id || !authorActorId) return;
    setIsDeleting(true);
    try {
      await ctrlDeleteMyReview(myReview.id, authorActorId);
      setMyReview(null);
      setMyExists(false);
      setIsEditing(false);
      setBody("");
      setRating(5);
      await Promise.all([loadActiveList(), loadCore()]);
    } catch (nextError) {
      if (mountedRef.current) setError(nextError);
    } finally {
      if (mountedRef.current) setIsDeleting(false);
    }
  }, [myReview, authorActorId, loadActiveList, loadCore]);

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
    setActiveList,
    loadingActiveList,
    hasMore,
    loadingMore,
    loadMore,
    recentComments,
    dimStats,
    myLoading,
    myReview,
    myExists,
    isEditing,
    isDeleting,
    startEdit,
    cancelEdit,
    deleteMyReview,
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
    authorActorId,
    submit,
    reload: loadActiveList,
  };
}
