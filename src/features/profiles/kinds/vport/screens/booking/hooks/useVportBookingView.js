import { useCallback, useEffect, useMemo, useState } from "react";

import { hydrateActorsFromRows } from "@/features/actors/adapters/hydrateActors.adapter";
import {
  useBookingAvailability,
  useCreateBooking,
  useManageAvailability,
  useOwnerBookingResources,
} from "@/features/booking/adapters/booking.adapter";
import { useVportBookingMutations } from "@/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingMutations";
import { useSubscribers } from "@/features/profiles/kinds/vport/hooks/subscribers/useSubscribers";
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
  const [ownerCustomerActorId, setOwnerCustomerActorId] = useState(null);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");
  const ownerFollowerSearch = useSubscribers(ownerActorId, {
    limit: 200,
    offset: 0,
    enabled: Boolean(isOwner && ownerActorId),
  });

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
  const ownerFollowerOptions = useMemo(() => {
    const rows = Array.isArray(ownerFollowerSearch.rows) ? ownerFollowerSearch.rows : [];
    const seenActorIds = new Set();

    return rows
      .map((row) => {
        const actorId = row?.actor_id ?? row?.id ?? null;
        if (!actorId || seenActorIds.has(actorId)) return null;
        seenActorIds.add(actorId);

        const displayName = String(row?.display_name || row?.username || "Citizen").trim();
        const username = String(row?.username || row?.slug || row?.vport_slug || "").trim() || null;

        return {
          actorId,
          displayName: displayName || "Citizen",
          username,
          avatar: row?.photo_url || "/avatar.jpg",
        };
      })
      .filter(Boolean);
  }, [ownerFollowerSearch.rows]);

  const selectedOwnerFollower = useMemo(
    () => ownerFollowerOptions.find((follower) => follower.actorId === ownerCustomerActorId) ?? null,
    [ownerFollowerOptions, ownerCustomerActorId]
  );

  const ownerFollowerMatches = useMemo(() => {
    if (!isOwner) return [];

    const query = String(ownerCustomerName || "").trim().toLowerCase();
    if (!query) return [];

    return ownerFollowerOptions
      .filter((follower) => {
        if (!follower) return false;
        if (ownerCustomerActorId && follower.actorId === ownerCustomerActorId) return false;

        const displayName = String(follower.displayName || "").toLowerCase();
        const username = String(follower.username || "").toLowerCase();
        const handle = username ? `@${username}` : "";
        return (
          displayName.includes(query) ||
          username.includes(query) ||
          handle.includes(query)
        );
      })
      .slice(0, 7);
  }, [isOwner, ownerCustomerName, ownerFollowerOptions, ownerCustomerActorId]);

  useEffect(() => {
    if (!selectedSlot) return;
    if (selectedSlots.includes(selectedSlot)) return;
    setSelectedSlot(null);
  }, [selectedSlot, selectedSlots]);

  useEffect(() => {
    if (!ownerCustomerActorId) return;
    if (ownerFollowerOptions.some((follower) => follower.actorId === ownerCustomerActorId)) return;
    setOwnerCustomerActorId(null);
  }, [ownerCustomerActorId, ownerFollowerOptions]);

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
      setOwnerCustomerActorId(null);
    },
    [slotsByDate]
  );

  const onResetDay = useCallback(() => {
    setSelectedSlot(null);
    setSelectedDateKey(null);
    setOwnerCustomerName("");
    setOwnerCustomerActorId(null);
  }, []);

  const onOwnerCustomerNameChange = useCallback(
    (nextValue) => {
      const nextName = String(nextValue ?? "");
      setOwnerCustomerName(nextName);

      if (!ownerCustomerActorId) return;

      const normalized = nextName.trim().toLowerCase();
      if (!normalized) {
        setOwnerCustomerActorId(null);
        return;
      }

      const selectedFollower = ownerFollowerOptions.find(
        (follower) => follower.actorId === ownerCustomerActorId
      );
      if (!selectedFollower) {
        setOwnerCustomerActorId(null);
        return;
      }

      const normalizedName = String(selectedFollower.displayName || "").trim().toLowerCase();
      const normalizedUsername = String(selectedFollower.username || "").trim().toLowerCase();
      if (
        normalized !== normalizedName &&
        normalized !== normalizedUsername &&
        normalized !== (normalizedUsername ? `@${normalizedUsername}` : "")
      ) {
        setOwnerCustomerActorId(null);
      }
    },
    [ownerCustomerActorId, ownerFollowerOptions]
  );

  const onSelectOwnerFollower = useCallback((follower) => {
    if (!follower?.actorId) return;
    setOwnerCustomerActorId(follower.actorId);
    setOwnerCustomerName(String(follower.displayName || follower.username || ""));
  }, []);

  const onClearOwnerFollower = useCallback(() => {
    setOwnerCustomerActorId(null);
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
    ownerCustomerActorId,
    setOwnerCustomerName,
    setOwnerCustomerActorId,
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
    ownerFollowerMatches,
    ownerFollowersLoading: ownerFollowerSearch.loading,
    ownerFollowersError: ownerFollowerSearch.error,
    selectedOwnerFollower,
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
    onOwnerCustomerNameChange,
    onSelectOwnerFollower,
    onClearOwnerFollower,
    onResetDay,
    ...mutations,
  };
}
