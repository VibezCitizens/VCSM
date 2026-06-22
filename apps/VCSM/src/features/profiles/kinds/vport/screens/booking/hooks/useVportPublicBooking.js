import { useCallback, useEffect, useMemo, useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import {
  useBookingServices,
  buildOccupiedIntervalsByDate,
  buildSlotsByDate,
  endOfMonth,
  groupSlotsBySegment,
  shiftMonth,
  startOfMonth,
  toDateKey,
  buildBookingPayload,
} from "@/features/booking/adapters/booking.adapter";
import { mapAvailabilityRule, useVportBookingOps } from "@/features/vportDashboard/adapters/vportDashboard.adapter";
import { canAdvanceBookingStep } from "@/features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.helpers";

const FALLBACK_DURATION = 30;

export function useVportPublicBooking({ profile }) {
  const actorId = profile?.actorId ?? profile?.actor_id ?? null;
  const { getAvailability, createBooking, listResources } = useVportBookingOps();
  const { readVportServicesByActor } = useBookingServices();

  const { identity, availableActors } = useIdentity();
  const isSignedIn = Boolean(identity?.actorId);
  const identityName = identity?.displayName ?? identity?.username ?? null;

  const citizenActorId = useMemo(() => {
    if (identity?.kind === "user") return identity.actorId;
    return (availableActors ?? []).find((a) => a.actorKind === "user")?.actorId ?? null;
  }, [identity, availableActors]);

  const [step, setStep] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedBarberActorId, setSelectedBarberActorId] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientName, setClientName] = useState(identityName ?? "");
  const [clientNote, setClientNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [dataReady, setDataReady] = useState(false);

  const [availabilityData, setAvailabilityData] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentMonthCursor = useMemo(() => startOfMonth(today), [today]);
  const nextMonthCursor = useMemo(() => shiftMonth(currentMonthCursor, 1), [currentMonthCursor]);
  const rangeStart = useMemo(() => currentMonthCursor.toISOString(), [currentMonthCursor]);
  const rangeEnd   = useMemo(() => endOfMonth(nextMonthCursor).toISOString(), [nextMonthCursor]);

  useEffect(() => {
    if (!actorId) return;
    let cancelled = false;
    Promise.all([
      readVportServicesByActor({ actorId, includeDisabled: false })
        .then((data) => { if (!cancelled) setServices(data ?? []); })
        .catch(() => { if (!cancelled) setServices([]); }),
      listResources({ actorId })
        .then((data) => {
          if (!cancelled) {
            const active = (data ?? []).filter((m) => m.is_active !== false);
            setBarbers(active);
          }
        })
        .catch(() => { if (!cancelled) setBarbers([]); }),
    ]).finally(() => {
      if (!cancelled) setDataReady(true);
    });
    return () => { cancelled = true; };
  }, [actorId]);

  const hasBarbers = barbers.length > 0;

  const selectedBarber = useMemo(
    () => barbers.find((b) => (b.member_actor_id ?? b.id) === selectedBarberActorId) ?? null,
    [barbers, selectedBarberActorId]
  );

  const resourceId = useMemo(() => {
    if (selectedBarber) return selectedBarber.id;
    return barbers[0]?.id ?? null;
  }, [selectedBarber, barbers]);

  useEffect(() => {
    if (!resourceId) {
      setAvailabilityData(null);
      return;
    }
    let cancelled = false;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    getAvailability({ resourceId, rangeStart, rangeEnd })
      .then((data) => {
        if (!cancelled) setAvailabilityData({
          ...data,
          rules: (data.rules ?? []).map(mapAvailabilityRule),
        });
      })
      .catch((e) => { if (!cancelled) setAvailabilityError(e); })
      .finally(() => { if (!cancelled) setAvailabilityLoading(false); });
    return () => { cancelled = true; };
  }, [resourceId, rangeStart, rangeEnd]);

  const rules = useMemo(
    () => (Array.isArray(availabilityData?.rules) ? availabilityData.rules : []),
    [availabilityData]
  );
  const exceptions = useMemo(
    () => (Array.isArray(availabilityData?.exceptions) ? availabilityData.exceptions : []),
    [availabilityData]
  );
  const rawBookings = useMemo(
    () => (Array.isArray(availabilityData?.bookings) ? availabilityData.bookings : []),
    [availabilityData]
  );

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const slotDuration = useMemo(
    () => Number(selectedService?.meta?.duration_minutes ?? FALLBACK_DURATION),
    [selectedService]
  );

  const hasAvailabilityRules = !availabilityLoading && Boolean(resourceId) && rules.length > 0;

  const occupiedIntervalsByDate = useMemo(
    () => buildOccupiedIntervalsByDate(rawBookings),
    [rawBookings]
  );

  const slotsCurrentMonth = useMemo(
    () => buildSlotsByDate({ monthCursor: currentMonthCursor, rules, exceptions, occupiedIntervalsByDate, slotDurationMinutes: slotDuration }),
    [currentMonthCursor, rules, exceptions, occupiedIntervalsByDate, slotDuration]
  );
  const slotsNextMonth = useMemo(
    () => buildSlotsByDate({ monthCursor: nextMonthCursor, rules, exceptions, occupiedIntervalsByDate, slotDurationMinutes: slotDuration }),
    [nextMonthCursor, rules, exceptions, occupiedIntervalsByDate, slotDuration]
  );

  const slotsByDate = useMemo(
    () => ({ ...slotsCurrentMonth, ...slotsNextMonth }),
    [slotsCurrentMonth, slotsNextMonth]
  );

  const dateStrip = useMemo(() => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = toDateKey(d);
      const slots = slotsByDate[key] ?? [];
      days.push({ key, date: d, slots, hasSlots: slots.length > 0 });
    }
    return days;
  }, [today, slotsByDate]);

  const hasUpcomingSlots = !availabilityLoading && dateStrip.some((d) => d.hasSlots);

  const selectedDaySlots = useMemo(
    () => (selectedDateKey ? slotsByDate[selectedDateKey] ?? [] : []),
    [selectedDateKey, slotsByDate]
  );
  const selectedDaySlotsBySegment = useMemo(
    () => groupSlotsBySegment(selectedDaySlots),
    [selectedDaySlots]
  );

  useEffect(() => {
    if (!identityName) return;
    setClientName((prev) => (prev ? prev : identityName));
  }, [identityName]);

  const effectiveSteps = useMemo(() => {
    const withDetails = hasBarbers
      ? ["service", "barber", "date", "time", "details", "confirm"]
      : ["service", "date", "time", "details", "confirm"];
    if (isSignedIn) return withDetails.filter((s) => s !== "details");
    return withDetails;
  }, [hasBarbers, isSignedIn]);

  const stepName   = effectiveSteps[step] ?? "service";
  const totalSteps = effectiveSteps.length;

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), [totalSteps]);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const canAdvanceFromStep = useCallback(
    (name) => canAdvanceBookingStep(name, { dataReady, availabilityLoading, hasAvailabilityRules, hasUpcomingSlots, selectedDateKey, selectedSlot, clientName, slotsByDate }),
    [dataReady, availabilityLoading, hasAvailabilityRules, hasUpcomingSlots, selectedDateKey, selectedSlot, clientName, slotsByDate]
  );

  const handleSelectDate = useCallback((key) => {
    setSelectedDateKey(key);
    setSelectedSlot(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!resourceId || !selectedSlot || !selectedDateKey) return;
    setSubmitting(true);
    setSubmitError(null);

    let payload;
    try {
      payload = buildBookingPayload({
        resourceId,
        serviceId: selectedService?.id ?? null,
        serviceLabel: selectedService?.label ?? selectedService?.key ?? null,
        durationMinutes: slotDuration,
        selectedDate: selectedDateKey,
        selectedTime: selectedSlot,
        requestActorId: citizenActorId,
        customerName: clientName.trim() || identityName || null,
        customerNote: clientNote.trim() || null,
      });
    } catch (err) {
      setSubmitting(false);
      setSubmitError(err.message ?? "Invalid booking details.");
      return;
    }

    try {
      await createBooking({
        resourceId: payload.resourceId,
        serviceId: payload.serviceId,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        timezone: payload.timezone,
        serviceLabelSnapshot: payload.serviceLabelSnapshot,
        durationMinutes: payload.durationMinutes,
        requestActorId: payload.requestActorId,
        customerActorId: payload.customerActorId,
        customerName: payload.customerName,
        customerNote: payload.customerNote,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message ?? "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    resourceId, selectedSlot, selectedDateKey, selectedService,
    slotDuration, citizenActorId, clientName, clientNote, identityName,
  ]);

  const reset = useCallback(() => {
    setStep(0);
    setSelectedServiceId(null);
    setSelectedBarberActorId(null);
    setSelectedDateKey(null);
    setSelectedSlot(null);
    setClientName(identityName ?? "");
    setClientNote("");
    setSubmitted(false);
    setSubmitError(null);
  }, [identityName]);

  return {
    step, stepName, effectiveSteps, totalSteps, goNext, goBack, canAdvanceFromStep,

    dataReady, services, barbers, hasBarbers,
    dateStrip, slotsByDate,

    selectedServiceId, selectedService, setSelectedServiceId,
    selectedBarberActorId, selectedBarber, setSelectedBarberActorId,
    selectedDateKey, setSelectedDateKey: handleSelectDate,
    selectedSlot, setSelectedSlot,
    selectedDaySlots, selectedDaySlotsBySegment,

    clientName, setClientName,
    clientNote, setClientNote,

    handleSubmit, submitting, submitError, submitted, reset,

    isSignedIn, identityName, resourceId,
    hasAvailabilityRules, hasUpcomingSlots,
    availabilityLoading, availabilityError,
  };
}
