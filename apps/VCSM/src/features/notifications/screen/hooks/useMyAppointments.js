import { useCallback, useEffect, useMemo, useState } from "react";
import { useBookingOps } from "@/features/booking/adapters/booking.adapter";
import { dismissBooking } from "@booking";

export function useMyAppointments({ actorId } = {}) {
  const { listMyBookings, cancelBooking } = useBookingOps()
  const [rows, setRows]           = useState([]);
  const [ownerNames, setOwnerNames] = useState({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [dismissing, setDismissing] = useState(null);

  const load = useCallback(async () => {
    if (!actorId) return;
    setLoading(true);
    setError(null);
    try {
      const { bookings, ownerNames: names } = await listMyBookings({ actorId });
      setRows(bookings);
      setOwnerNames(names);
    } catch (err) {
      setError(err?.message ?? "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => { load(); }, [load]);

  const now = useMemo(() => new Date(), []);

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

  const cancelAppointment = useCallback(
    async (bookingId) => {
      if (!actorId) return;
      setCancelling(bookingId);
      try {
        await cancelBooking({ bookingId, requestActorId: actorId });
        await load();
      } catch (err) {
        throw err;
      } finally {
        setCancelling(null);
      }
    },
    [actorId, load]
  );

  const dismissAppointment = useCallback(
    async (bookingId) => {
      if (!actorId) return;
      setDismissing(bookingId);
      try {
        await dismissBooking({ bookingId, requestActorId: actorId });
        setRows(prev => prev.filter(b => b.id !== bookingId));
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
    ownerNames,
    reload: load,
    cancelAppointment,
    cancelling,
    dismissAppointment,
    dismissing,
  };
}

export default useMyAppointments;
