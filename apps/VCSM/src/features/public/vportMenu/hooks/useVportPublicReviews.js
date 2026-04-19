import { useCallback, useEffect, useState } from "react";
import {
  getVportPublicReviewsController,
  getVportPublicReviewsPageController,
} from "@/features/public/vportMenu/controller/getVportPublicReviews.controller";

const EMPTY_SUMMARY = { reviewCount: 0, averageRating: null, firstReviewAt: null, lastReviewActivityAt: null };

export function useVportPublicReviews({ actorId } = {}) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!actorId) return;
    setLoading(true);
    setError(null);

    try {
      const result = await getVportPublicReviewsController(actorId);
      setSummary(result.summary);
      setReviews(result.reviews);
      setDimensions(result.dimensions);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!actorId || loadingMore || !hasMore || !reviews.length) return;
    const cursor = reviews[reviews.length - 1]?.reviewActivityAt;
    if (!cursor) return;

    setLoadingMore(true);
    try {
      const result = await getVportPublicReviewsPageController(actorId, { cursor });
      setReviews((prev) => [...prev, ...result.reviews]);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [actorId, loadingMore, hasMore, reviews]);

  return { summary, reviews, dimensions, hasMore, loading, loadingMore, error, loadMore };
}

export default useVportPublicReviews;
