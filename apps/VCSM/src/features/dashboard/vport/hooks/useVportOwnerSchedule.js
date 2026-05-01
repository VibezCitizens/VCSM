import { useCallback, useEffect, useRef, useState } from "react";
import { hydrateActorsByIds } from "@hydration";
import { loadDayScheduleController } from "@/features/dashboard/vport/controller/loadDaySchedule.controller";
import { createOwnerBookingController } from "@/features/dashboard/vport/controller/createOwnerBooking.controller";
import { updateBookingStatusController, rescheduleBookingController } from "@/features/dashboard/vport/controller/updateVportBooking.controller";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDateKey(dateKey, days) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

export function useVportOwnerSchedule({ actorId }) {
  const [dateKey, setDateKey]           = useState(todayKey);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const [createModal, setCreateModal]   = useState(null);  // { resourceId, startTime, dateKey }
  const [detailModal, setDetailModal]   = useState(null);  // booking object

  const [mobileBarberIdx, setMobileBarberIdx] = useState(0);

  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Stable ref so refresh doesn't change identity when dateKey changes
  const dateKeyRef = useRef(dateKey);
  dateKeyRef.current = dateKey;

  const load = useCallback(async (key) => {
    if (!actorId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loadDayScheduleController({ actorId, dateKey: key });
      setScheduleData(data);
      const ids = data.lanes.map((l) => l.resource.member_actor_id).filter(Boolean);
      if (ids.length) hydrateActorsByIds(ids);
    } catch (e) {
      setError(e?.message ?? "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => {
    load(dateKey);
  }, [load, dateKey]);

  const refresh = useCallback(() => load(dateKeyRef.current), [load]);

  // Date navigation
  const goToDate  = useCallback((key) => setDateKey(key), []);
  const goToToday = useCallback(() => setDateKey(todayKey()), []);
  const prevDay   = useCallback(() => setDateKey((k) => shiftDateKey(k, -1)), []);
  const nextDay   = useCallback(() => setDateKey((k) => shiftDateKey(k, 1)), []);

  // Create modal
  const openCreateModal = useCallback((resourceId, startTime) => {
    setCreateModal({ resourceId, startTime, dateKey: dateKeyRef.current });
    setSaveError(null);
  }, []);
  const closeCreateModal = useCallback(() => setCreateModal(null), []);

  const submitCreateBooking = useCallback(async (form) => {
    setSaving(true);
    setSaveError(null);
    try {
      const [y, mo, d] = form.dateKey.split("-").map(Number);
      const [sh, sm]   = form.startTime.split(":").map(Number);
      const startsAt   = new Date(y, mo - 1, d, sh, sm, 0, 0).toISOString();
      const endsAt     = new Date(new Date(startsAt).getTime() + Number(form.durationMinutes) * 60000).toISOString();
      await createOwnerBookingController({
        actorId,
        resourceId:            form.resourceId,
        serviceId:             form.serviceId || null,
        startsAt,
        endsAt,
        timezone:              Intl.DateTimeFormat().resolvedOptions().timeZone,
        serviceLabelSnapshot:  form.serviceLabelSnapshot || "Appointment",
        durationMinutes:       Number(form.durationMinutes),
        customerName:          form.customerName || null,
        customerNote:          form.customerNote || null,
      });
      setCreateModal(null);
      refresh();
    } catch (e) {
      setSaveError(e?.message ?? "Failed to create booking");
    } finally {
      setSaving(false);
    }
  }, [actorId, refresh]);

  // Detail modal
  const openDetailModal  = useCallback((booking) => { setDetailModal(booking); setSaveError(null); }, []);
  const closeDetailModal = useCallback(() => setDetailModal(null), []);

  const updateBookingStatus = useCallback(async (bookingId, status) => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateBookingStatusController({ bookingId, status });
      setDetailModal(null);
      refresh();
    } catch (e) {
      setSaveError(e?.message ?? "Failed to update booking");
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const rescheduleBooking = useCallback(async ({ bookingId, startsAt, endsAt, resourceId, durationMinutes }) => {
    setSaving(true);
    setSaveError(null);
    try {
      await rescheduleBookingController({ bookingId, startsAt, endsAt, resourceId, durationMinutes });
      setDetailModal(null);
      refresh();
    } catch (e) {
      setSaveError(e?.message ?? "Failed to reschedule booking");
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const isToday = todayKey() === dateKey;

  return {
    dateKey, isToday,
    scheduleData, loading, error, refresh,
    mobileBarberIdx, setMobileBarberIdx,
    createModal, openCreateModal, closeCreateModal, submitCreateBooking,
    detailModal, openDetailModal, closeDetailModal, updateBookingStatus, rescheduleBooking,
    saving, saveError,
    goToDate, goToToday, prevDay, nextDay,
  };
}
