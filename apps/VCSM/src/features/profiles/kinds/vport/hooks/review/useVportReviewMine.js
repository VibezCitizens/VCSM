import { useCallback, useRef, useState } from "react";
import {
  ctrlDeleteMyReview,
  ctrlGetMyActiveReview,
  ctrlSubmitReview,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";
import { safeNum } from "@/features/profiles/kinds/vport/hooks/review/useVportReviews.helpers";

export function useVportReviewMine({
  authorActorId,
  targetActorId,
  canReview,
  identity,
  tab,
  dimensions,
  serviceId,
  mountedRef,
  setActiveList,
  setError,
  loadActiveList,
  loadCore,
}) {
  const [myLoading, setMyLoading] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [myExists, setMyExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const inFlightMyRef = useRef(false);

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
        setRating(firstRating ?? 5);
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
  }, [authorActorId, targetActorId, canReview, isEditing, mountedRef]);

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

      setActiveList((prev) =>
        prev.map((r) =>
          r.id === optimisticId ? { ...saved, isOptimistic: false } : r
        )
      );
      setMyReview(saved);
      setMsg("Saved");

      loadCore().catch(() => {});

      return saved;
    } catch (nextError) {
      if (!mountedRef.current) throw nextError;

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
    mountedRef,
    rating,
    serviceId,
    setActiveList,
    setError,
    tab,
    targetActorId,
  ]);

  const submitReview = useCallback(async ({ body: reviewBody, ratings: reviewRatings }) => {
    if (!authorActorId || !targetActorId) {
      throw new Error("You must be signed in to leave a review.");
    }
    if (!Array.isArray(reviewRatings) || !reviewRatings.length) {
      throw new Error("Rate at least one category before submitting.");
    }

    const now = new Date().toISOString();
    const optimisticId = "optimistic-" + crypto.randomUUID();
    const avgRating = reviewRatings.reduce((s, x) => s + x.rating, 0) / reviewRatings.length;

    const optimisticReview = {
      id: optimisticId,
      targetActorId,
      authorActorId,
      body: reviewBody || "",
      overallRating: Math.round(avgRating * 100) / 100,
      ratings: reviewRatings.map((nr) => ({ dimensionKey: nr.dimensionKey, rating: nr.rating })),
      createdAt: now,
      updatedAt: now,
      reviewActivityAt: now,
      authorDisplayName: identity?.displayName ?? "You",
      authorUsername: identity?.username ?? "",
      authorAvatarUrl: identity?.avatarUrl ?? identity?.avatar ?? "",
      isOptimistic: true,
    };

    setActiveList((prev) => [optimisticReview, ...(Array.isArray(prev) ? prev : [])]);

    try {
      const saved = await ctrlSubmitReview({
        targetActorId,
        authorActorId,
        body: reviewBody || null,
        ratings: reviewRatings,
      });

      if (!mountedRef.current) return saved;

      setActiveList((prev) =>
        (Array.isArray(prev) ? prev : []).map((rev) =>
          rev.id === optimisticId ? { ...saved, isOptimistic: false } : rev
        )
      );
      if (saved) setMyReview(saved);
      setMyExists(true);
      loadCore().catch(() => {});

      return saved;
    } catch (e) {
      if (mountedRef.current) {
        setActiveList((prev) =>
          (Array.isArray(prev) ? prev : []).filter((rev) => rev.id !== optimisticId)
        );
      }
      throw e;
    }
  }, [authorActorId, targetActorId, identity, mountedRef, setActiveList, loadCore]);

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
  }, [myReview, authorActorId, mountedRef, setError, loadActiveList, loadCore]);

  return {
    myLoading,
    myReview,
    setMyReview,
    myExists,
    setMyExists,
    isEditing,
    isDeleting,
    rating,
    setRating,
    body,
    setBody,
    saving,
    msg,
    setMsg,
    startEdit,
    cancelEdit,
    submit,
    submitReview,
    deleteMyReview,
    loadMyReview,
  };
}
