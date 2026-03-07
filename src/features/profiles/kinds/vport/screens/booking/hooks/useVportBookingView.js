import { useCallback, useEffect, useMemo, useState } from "react";

import { hydrateActorsFromRows } from "@/features/actors/controllers/hydrateActors.controller";
import {
  useBookingAvailability,
  useCreateBooking,
  useManageAvailability,
  useOwnerBookingResources,
} from "@/features/booking/adapters/booking.adapter";
import { useVportBookingMutations } from "@/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingMutations";
import {
  buildBookingsByDate,
  buildCustomerActorRows,
  buildMonthCells,
  buildMonthStats,
  buildOccupiedIntervalsByDate,
  buildSlotsByDate,
  buildUpcomingAppointments,
  buildWeeklyAvailabilityDays,
} from "@/features/profiles/kinds/vport/screens/booking/model/bookingCalendarAvailability.model";
import {
  addDays,
  endOfMonth,
  formatDateLabel,
  formatMonthLabel,
  fromDateKey,
  getNearestDurationOption,
  groupSlotsBySegment,
  normalizeDurationMinutes,
  shiftMonth,
  startOfMonth,
  startOfWeek,
  VISITOR_SLOT_DURATION_MINUTES,
} from "@/features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model";
import { useIdentity } from "@/state/identity/identityContext";

function useAvailabilityData(availability) {
  const bookings = useMemo(
    () => (Array.isArray(availability.data?.bookings) ? availability.data.bookings : []),
    [availability.data?.bookings]
  );
  const rules = useMemo(
    () => (Array.isArray(availability.data?.rules) ? availability.data.rules : []),
    [availability.data?.rules]
  );
  const exceptions = useMemo(
    () => (Array.isArray(availability.data?.exceptions) ? availability.data.exceptions : []),
    [availability.data?.exceptions]
  );
  const serviceProfiles = useMemo(
    () =>
      (Array.isArray(availability.data?.serviceProfiles) ? availability.data.serviceProfiles : []),
    [availability.data?.serviceProfiles]
  );
  return { bookings, rules, exceptions, serviceProfiles };
}

export function useVportBookingView({ profile, isOwner = false }) {
  const { identity } = useIdentity();
  const viewerActorId = identity?.actorId ?? null;
  const ownerActorId = profile?.actorId ?? profile?.actor_id ?? null;
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [ownerCustomerName, setOwnerCustomerName] = useState("");
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");

  const resources = useOwnerBookingResources({
    ownerActorId,
    includeInactive: isOwner,
    enabled: Boolean(ownerActorId),
  });

  const resourceId = resources.primary?.id ?? null;
  const rangeStart = startOfMonth(monthCursor).toISOString();
  const rangeEnd = endOfMonth(monthCursor).toISOString();

  const availability = useBookingAvailability({
    resourceId,
    rangeStart,
    rangeEnd,
    enabled: Boolean(resourceId),
  });

  const createBooking = useCreateBooking();
  const manageAvailability = useManageAvailability();
  const { bookings, rules, exceptions, serviceProfiles } = useAvailabilityData(availability);

  const serviceDurationMinutes = useMemo(() => {
    const firstProfileWithDuration = serviceProfiles.find(
      (serviceProfile) =>
        Number.isFinite(Number(serviceProfile?.durationMinutes)) &&
        Number(serviceProfile.durationMinutes) > 0
    );
    return normalizeDurationMinutes(firstProfileWithDuration?.durationMinutes, 30);
  }, [serviceProfiles]);

  const slotDurationMinutes = useMemo(() => {
    if (!isOwner) return VISITOR_SLOT_DURATION_MINUTES;
    if (Number.isFinite(Number(selectedDurationMinutes))) {
      return getNearestDurationOption(selectedDurationMinutes);
    }
    return getNearestDurationOption(serviceDurationMinutes);
  }, [isOwner, selectedDurationMinutes, serviceDurationMinutes]);

  const bookingsByDate = useMemo(
    () => buildBookingsByDate(bookings, { isOwner }),
    [bookings, isOwner]
  );

  const occupiedIntervalsByDate = useMemo(
    () => buildOccupiedIntervalsByDate(bookings),
    [bookings]
  );

  const slotsByDate = useMemo(
    () =>
      buildSlotsByDate({
        monthCursor,
        rules,
        exceptions,
        occupiedIntervalsByDate,
        slotDurationMinutes,
      }),
    [monthCursor, rules, exceptions, occupiedIntervalsByDate, slotDurationMinutes]
  );

  const monthCells = useMemo(
    () =>
      buildMonthCells({
        monthDate: monthCursor,
        selectedDateKey,
        bookingsByDate,
        slotsByDate,
      }),
    [monthCursor, selectedDateKey, bookingsByDate, slotsByDate]
  );

  const selectedAppointments = useMemo(
    () => bookingsByDate[selectedDateKey] ?? [],
    [bookingsByDate, selectedDateKey]
  );
  const selectedSlots = useMemo(() => slotsByDate[selectedDateKey] ?? [], [slotsByDate, selectedDateKey]);

  useEffect(() => {
    if (!selectedSlot) return;
    if (selectedSlots.includes(selectedSlot)) return;
    setSelectedSlot(null);
  }, [selectedSlot, selectedSlots]);

  useEffect(() => {
    const customerActorRows = buildCustomerActorRows(bookings);
    if (!customerActorRows.length) return;
    Promise.resolve(hydrateActorsFromRows(customerActorRows)).catch(() => {});
  }, [bookings]);

  useEffect(() => {
    if (isOwner) return;
    if (viewMode !== "agenda") return;
    setViewMode("calendar");
  }, [isOwner, viewMode]);

  const agendaWeekAnchor = useMemo(() => {
    const selectedDate = selectedDateKey ? fromDateKey(selectedDateKey) : null;
    if (selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())) return selectedDate;
    return new Date();
  }, [selectedDateKey]);
  const agendaWeekStart = useMemo(() => startOfWeek(agendaWeekAnchor), [agendaWeekAnchor]);
  const agendaWeekLabel = useMemo(() => {
    const weekEnd = addDays(agendaWeekStart, 6);
    const startLabel = agendaWeekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endLabel = weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${startLabel} - ${endLabel}`;
  }, [agendaWeekStart]);

  const weeklyAvailabilityDays = useMemo(
    () =>
      buildWeeklyAvailabilityDays({
        agendaWeekStart,
        rules,
        exceptions,
        occupiedIntervalsByDate,
        slotDurationMinutes,
      }),
    [agendaWeekStart, rules, exceptions, occupiedIntervalsByDate, slotDurationMinutes]
  );
  const upcomingAppointments = useMemo(
    () => buildUpcomingAppointments(bookingsByDate),
    [bookingsByDate]
  );
  const monthStats = useMemo(
    () => buildMonthStats({ slotsByDate, bookingsByDate }),
    [slotsByDate, bookingsByDate]
  );

  const onSelectDate = useCallback(
    (dateKey) => {
      const picked = fromDateKey(dateKey);
      picked.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (picked.getTime() < now.getTime()) return;
      if ((slotsByDate[dateKey] ?? []).length === 0) return;
      setSelectedDateKey(dateKey);
      setSelectedSlot(null);
      setOwnerCustomerName("");
    },
    [slotsByDate]
  );

  const onResetDay = useCallback(() => {
    setSelectedSlot(null);
    setSelectedDateKey(null);
    setOwnerCustomerName("");
  }, []);

  const mutations = useVportBookingMutations({
    isOwner,
    viewerActorId,
    resourceId,
    selectedSlot,
    selectedDateKey,
    selectedSlots,
    slotDurationMinutes,
    ownerCustomerName,
    setOwnerCustomerName,
    createBooking,
    manageAvailability,
    availability,
  });

  return {
    resources,
    availability,
    createBooking,
    manageAvailability,
    monthLabel: formatMonthLabel(monthCursor),
    monthCells,
    monthStats,
    viewMode,
    selectedDateLabel: formatDateLabel(selectedDateKey),
    selectedSlot,
    selectedSlots,
    selectedSlotsBySegment: groupSlotsBySegment(selectedSlots),
    selectedAppointments,
    ownerCustomerName,
    slotDurationMinutes,
    canRequestSelectedSlot: !isOwner || Boolean(viewerActorId),
    isSelectedSlotAvailable: Boolean(selectedSlot) && selectedSlots.includes(selectedSlot),
    hasSelectedAvailableDay:
      Boolean(selectedDateKey) &&
      Array.isArray(slotsByDate[selectedDateKey]) &&
      slotsByDate[selectedDateKey].length > 0,
    upcomingAppointments,
    weeklyAvailabilityDays,
    agendaWeekLabel,
    onPrevMonth: () => setMonthCursor((prev) => shiftMonth(prev, -1)),
    onNextMonth: () => setMonthCursor((prev) => shiftMonth(prev, 1)),
    onSelectDate,
    onSelectSlot: (slotValue) => setSelectedSlot((prev) => (prev === slotValue ? null : slotValue)),
    onChangeViewMode: setViewMode,
    onChangeDuration: setSelectedDurationMinutes,
    onOwnerCustomerNameChange: setOwnerCustomerName,
    onResetDay,
    ...mutations,
  };
}
