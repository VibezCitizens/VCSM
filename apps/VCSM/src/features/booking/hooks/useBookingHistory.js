// ============================================================
// Booking — Booking History Hook
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listBookingHistory as listBookingHistoryController } from "@booking";

const PAGE_SIZE = 30;

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function useBookingHistory({ resourceId, enabled = true } = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const offsetRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const statuses = useMemo(() => {
    if (statusFilter === "all") return null;
    return [statusFilter];
  }, [statusFilter]);

  const load = useCallback(async () => {
    if (!enabled || !resourceId) return;

    setLoading(true);
    setError(null);
    offsetRef.current = 0;

    try {
      const result = await listBookingHistoryController({
        resourceId,
        statuses,
        limit: PAGE_SIZE,
        offset: 0,
      });

      if (!mountedRef.current) return;

      setBookings(result.bookings);
      setHasMore(result.hasMore);
      offsetRef.current = result.bookings.length;
    } catch (e) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [resourceId, statuses, enabled]);

  const loadMore = useCallback(async () => {
    if (!resourceId || !hasMore || loadingMore) return;

    setLoadingMore(true);

    try {
      const result = await listBookingHistoryController({
        resourceId,
        statuses,
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });

      if (!mountedRef.current) return;

      setBookings((prev) => [...prev, ...result.bookings]);
      setHasMore(result.hasMore);
      offsetRef.current += result.bookings.length;
    } catch (_) {
      // silent
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [resourceId, statuses, hasMore, loadingMore]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    bookings,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reload: load,
    statusFilter,
    setStatusFilter,
    statusFilters: STATUS_FILTERS,
  };
}
