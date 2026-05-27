import { useCallback, useRef, useState } from "react";
import {
  ctrlDeleteMyReview,
  ctrlGetMyActiveReview,
  ctrlSubmitReview,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";

export function useVportReviewMine({
  authorActorId,
  targetActorId,
  canReview,
  identity,
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

  const inFlightMyRef = useRef(false);

  const loadMyReview = useCallback(async () => {
    if (!authorActorId || !targetActorId || !canReview) {
      setMyReview(null);
      setMyExists(false);
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
    } catch {
      if (!mountedRef.current) return;
      setMyReview(null);
      setMyExists(false);
    } finally {
      if (mountedRef.current) setMyLoading(false);
      inFlightMyRef.current = false;
    }
  }, [authorActorId, targetActorId, canReview, mountedRef]);

  const startEdit = useCallback(() => {
    if (!myReview) return;
    setIsEditing(true);
  }, [myReview]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

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
    startEdit,
    cancelEdit,
    submitReview,
    deleteMyReview,
    loadMyReview,
  };
}
