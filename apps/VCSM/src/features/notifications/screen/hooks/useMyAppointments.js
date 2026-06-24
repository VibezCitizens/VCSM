import { useCallback, useEffect, useMemo, useState } from "react";
import { useBookingOps } from "@/features/booking/adapters/booking.adapter";
import { dismissBooking } from "@booking";
import { hydrateActorsByIds } from "@hydration";

export function useMyAppointments({ actorId } = {}) {
  const { listMyBookings, cancelBooking } = useBookingOps()
  const [rows, setRows]           = useState([]);
  const [previousRows, setPreviousRows] = useState([]);
  const [ownerNames, setOwnerNames] = useState({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [dismissing, setDismissing] = useState(null);
  const [previousLoaded, setPreviousLoaded]   = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  // First instant of the current month (local), as ISO. This is the boundary
  // between eagerly-loaded "this month + upcoming" appointments and the
  // "previous" appointments that are only fetched when the citizen asks.
  const monthStartISO = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).toISOString();
  }, []);

  const mergeOwnerNames = useCallback((names) => {
    setOwnerNames((prev) => ({ ...prev, ...(names ?? {}) }));
  }, []);

  const hydrateOwners = useCallback((bookings) => {
    const allActorIds = [
      ...bookings.map((b) => b.vportActorId ?? b.ownerActorId),
      ...bookings.map((b) => b.memberActorId),
    ].filter(Boolean);
    const uniqueIds = [...new Set(allActorIds)];
    if (uniqueIds.length) hydrateActorsByIds(uniqueIds).catch(() => {});
  }, []);

  // Eager load: current month + everything upcoming (starts_at >= month start).
  const load = useCallback(async () => {
    if (!actorId) return;
    setLoading(true);
    setError(null);
    try {
      const { bookings, ownerNames: names } = await listMyBookings({ actorId, startsAtFrom: monthStartISO });
      setRows(bookings);
      mergeOwnerNames(names);
      hydrateOwners(bookings);
    } catch (err) {
      setError(err?.message ?? "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [actorId, monthStartISO, mergeOwnerNames, hydrateOwners]);

  // Lazy load: previous appointments (starts_at < month start). Fetched only
  // when the citizen taps the "Previous appointments" pill.
  const loadPrevious = useCallback(async () => {
    if (!actorId || loadingPrevious) return;
    setLoadingPrevious(true);
    setError(null);
    try {
      const { bookings, ownerNames: names } = await listMyBookings({ actorId, startsAtTo: monthStartISO });
      setPreviousRows(bookings);
      setPreviousLoaded(true);
      mergeOwnerNames(names);
      hydrateOwners(bookings);
    } catch (err) {
      setError(err?.message ?? "Failed to load previous appointments.");
    } finally {
      setLoadingPrevious(false);
    }
  }, [actorId, monthStartISO, loadingPrevious, mergeOwnerNames, hydrateOwners]);

  useEffect(() => { load(); }, [load]);

  const now = useMemo(() => new Date(), []);

  // Current-month + upcoming bookings, split by status across the eager tabs.
  const upcoming = useMemo(
    () => rows.filter((b) => b.status === "confirmed" && new Date(b.startsAt) > now),
    [rows, now]
  );

  const pending = useMemo(
    () => rows.filter((b) => b.status === "pending"),
    [rows]
  );

  const past = useMemo(
    () =>
      rows.filter(
        (b) =>
          b.status === "completed" ||
          b.status === "cancelled" ||
          b.status === "no_show" ||
          (b.status === "confirmed" && new Date(b.startsAt) <= now)
      ),
    [rows, now]
  );

  // "Archived" is its own lazily-loaded dataset: every appointment from months
  // before the current one, fetched only when the citizen opens that tab.
  const archived = previousRows;

  const cancelAppointment = useCallback(
    async (bookingId) => {
      if (!actorId) return;
      setCancelling(bookingId);
      try {
        await cancelBooking({ bookingId, requestActorId: actorId });
        await load();
        // Keep already-revealed previous appointments in sync after a cancel.
        if (previousLoaded) await loadPrevious();
      } catch (err) {
        throw err;
      } finally {
        setCancelling(null);
      }
    },
    [actorId, load, loadPrevious, previousLoaded]
  );

  const dismissAppointment = useCallback(
    async (bookingId) => {
      if (!actorId) return;
      setDismissing(bookingId);
      try {
        await dismissBooking({ bookingId, requestActorId: actorId });
        setRows(prev => prev.filter(b => b.id !== bookingId));
        setPreviousRows(prev => prev.filter(b => b.id !== bookingId));
      } catch (err) {
        throw err;
      } finally {
        setDismissing(null);
      }
    },
    [actorId]
  );

  return {
    loading,
    error,
    upcoming,
    pending,
    past,
    archived,
    ownerNames,
    reload: load,
    cancelAppointment,
    cancelling,
    dismissAppointment,
    dismissing,
    loadPrevious,
    previousLoaded,
    loadingPrevious,
  };
}

export default useMyAppointments;
