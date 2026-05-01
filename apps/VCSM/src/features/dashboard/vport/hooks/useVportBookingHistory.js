import { useCallback, useEffect, useState } from "react";
import { listVportBookingHistoryController } from "@/features/dashboard/vport/controller/listVportBookingHistory.controller";
import { mapBooking } from "@/features/dashboard/vport/model/vportBooking.model";

export default function useVportBookingHistory({ resourceId, enabled = true, pageSize = 50 } = {}) {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(false);
  const [error, setError]             = useState(null);
  const [offset, setOffset]           = useState(0);

  const load = useCallback(async () => {
    if (!enabled || !resourceId) return;
    setLoading(true);
    setError(null);
    setOffset(0);
    try {
      const raw          = await listVportBookingHistoryController({ resourceId, limit: pageSize + 1, offset: 0 });
      const hasNextPage  = raw.length > pageSize;
      setBookings((hasNextPage ? raw.slice(0, pageSize) : raw).map(mapBooking));
      setHasMore(hasNextPage);
      setOffset(pageSize);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [resourceId, enabled, pageSize]);

  useEffect(() => { load(); }, [load]);

  const loadMore = useCallback(async () => {
    if (!resourceId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const raw         = await listVportBookingHistoryController({ resourceId, limit: pageSize + 1, offset });
      const hasNextPage = raw.length > pageSize;
      setBookings(prev => [...prev, ...(hasNextPage ? raw.slice(0, pageSize) : raw).map(mapBooking)]);
      setHasMore(hasNextPage);
      setOffset(o => o + pageSize);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [resourceId, loadingMore, hasMore, offset, pageSize]);

  return { bookings, loading, loadingMore, hasMore, error, loadMore, reload: load };
}
