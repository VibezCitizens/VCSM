// src/features/profiles/kinds/vport/hooks/review/useVportReviewCompose.js

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * useVportReviewCompose
 *
 * Owns all compose-form state for the reviews module.
 * Extracted from VportReviewsView to satisfy the VCSM screen role boundary contract:
 * View Screens must not own business state — that belongs in hooks.
 *
 * State owned:
 *   body          — review text input
 *   ratingsMap    — { [dimensionKey]: rating (1–5 | 0) }
 *   activeDimKey  — which dimension pill is currently active
 *   submitting    — async submit in progress
 *   submitErr     — last submit error (or null)
 *
 * @param {object} params
 * @param {Array<{key: string, label: string}>} params.dynamicDimensions
 * @param {string|null} params.reviewAuthorActorId
 * @param {object|null} params.myReview     — current user's existing review (for edit pre-fill)
 * @param {boolean} params.isEditing        — edit mode flag from useVportReviews
 * @param {Function} params.cancelEdit      — cancel edit from useVportReviews
 * @param {Function} params.submitReview    — canonical submit from useVportReviews
 * @returns {object} compose form state + handlers
 */
export function useVportReviewCompose({
  dynamicDimensions,
  reviewAuthorActorId,
  myReview,
  isEditing,
  cancelEdit,
  submitReview,
}) {
  const [body, setBody] = useState("");
  const [ratingsMap, setRatingsMap] = useState({});
  const [activeDimKey, setActiveDimKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  // Sync ratingsMap keys whenever dimension list changes (vport type load / tab switch).
  useEffect(() => {
    setRatingsMap((prev) => {
      const next = {};
      for (const d of dynamicDimensions) next[d.key] = Number(prev?.[d.key] ?? 0);
      return next;
    });
  }, [dynamicDimensions]);

  // Keep activeDimKey pointing at a valid dimension.
  useEffect(() => {
    if (!dynamicDimensions.length) { setActiveDimKey(null); return; }
    setActiveDimKey((prev) => {
      const stillExists = dynamicDimensions.some((d) => d.key === prev);
      return stillExists ? prev : dynamicDimensions[0].key;
    });
  }, [dynamicDimensions]);

  // Pre-fill form from existing review when entering edit mode.
  useEffect(() => {
    if (!isEditing || !myReview) return;

    setBody(myReview.body ?? "");

    if (Array.isArray(myReview.ratings)) {
      const map = {};
      for (const rt of myReview.ratings) {
        const key = rt?.dimensionKey ?? rt?.dimension_key;
        const val = Number(rt?.rating ?? 0);
        if (key && val >= 1 && val <= 5) map[key] = val;
      }
      setRatingsMap((prev) => ({ ...prev, ...map }));
    }
  }, [isEditing, myReview]);

  const activeDimension = useMemo(() => {
    if (!dynamicDimensions.length) return null;
    return dynamicDimensions.find((d) => d.key === activeDimKey) ?? dynamicDimensions[0];
  }, [dynamicDimensions, activeDimKey]);

  const normalizedRatings = useMemo(() => {
    return dynamicDimensions
      .map((d) => ({ dimensionKey: d.key, rating: Number(ratingsMap?.[d.key] ?? 0) }))
      .filter((row) => Number.isFinite(row.rating) && row.rating >= 1 && row.rating <= 5);
  }, [dynamicDimensions, ratingsMap]);

  const ratedCount = normalizedRatings.length;
  const totalDims = dynamicDimensions.length;

  const resetForm = useCallback(() => {
    setBody("");
    setRatingsMap(Object.fromEntries(dynamicDimensions.map((d) => [d.key, 0])));
    setSubmitErr(null);
  }, [dynamicDimensions]);

  const handleSubmit = useCallback(async () => {
    setSubmitErr(null);
    if (!reviewAuthorActorId) {
      setSubmitErr(new Error("You must be signed in to leave a review."));
      return;
    }
    if (!normalizedRatings.length) {
      setSubmitErr(new Error("Rate at least one category before submitting."));
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({ body: body.trim() || null, ratings: normalizedRatings });
      resetForm();
      if (isEditing && typeof cancelEdit === "function") cancelEdit();
    } catch (e) {
      setSubmitErr(e);
    } finally {
      setSubmitting(false);
    }
  }, [
    reviewAuthorActorId,
    normalizedRatings,
    submitReview,
    body,
    resetForm,
    isEditing,
    cancelEdit,
  ]);

  return {
    // Form state
    body,
    setBody,
    ratingsMap,
    setRatingsMap,
    activeDimKey,
    setActiveDimKey,
    activeDimension,
    // Computed
    normalizedRatings,
    ratedCount,
    totalDims,
    // Async state
    submitting,
    submitErr,
    // Handlers
    handleSubmit,
    resetForm,
  };
}
