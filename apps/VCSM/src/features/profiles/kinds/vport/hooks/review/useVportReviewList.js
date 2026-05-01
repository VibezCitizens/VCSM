import { useCallback, useRef, useState } from "react";
import {
  ctrlListReviews,
} from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";
import * as ServiceCtrl from "@/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller";

export function useVportReviewList({ targetActorId, tab, serviceId, mountedRef, setError }) {
  const [activeList, setActiveList] = useState([]);
  const [loadingActiveList, setLoadingActiveList] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const inFlightListRef = useRef(false);

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
  }, [targetActorId, tab, serviceId, mountedRef, setError]);

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
  }, [targetActorId, hasMore, nextCursor, loadingMore, tab, mountedRef]);

  return {
    activeList,
    setActiveList,
    loadingActiveList,
    hasMore,
    loadingMore,
    loadMore,
    loadActiveList,
  };
}
