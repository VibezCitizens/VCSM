import { useCallback, useEffect, useMemo, useState } from "react";
import { hydrateActorsFromRows } from "@/state/actors/hydrateActors";
import {
  useBookingAvailability,
  useBookingContextResolver,
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
  buildOccupiedIntervalsByDate,
  buildSlotsByDate,
} from "@/features/booking/model/bookingCalendarAvailability.model";
import {
  endOfMonth,
  formatDateLabel,
  formatMonthLabel,
  fromDateKey,
  getNearestDurationOption,
  groupSlotsBySegment,
  isSlotExpired,
  normalizeDurationMinutes,
  shiftMonth,
  startOfMonth,
  VISITOR_SLOT_DURATION_MINUTES,
} from "@/features/booking/model/bookingCalendarDate.model";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { canCitizenBook } from "@/state/identity/identitySelectors";
import { useActorConsistencyCheck } from "@debuggers/identity/useActorConsistencyCheck";
import { useAvailabilityData } from "@/features/profiles/kinds/vport/screens/booking/hooks/useAvailabilityData";
import { useOwnerFollowerSelector } from "@/features/profiles/kinds/vport/screens/booking/hooks/useOwnerFollowerSelector";
import { useAgendaCalendarValues } from "@/features/profiles/kinds/vport/screens/booking/hooks/useAgendaCalendarValues";

export function useVportBookingView({ profile, isOwner = false }) {
  const { identity } = useIdentity();
  const viewerActorId = identity?.actorId ?? null;
  useActorConsistencyCheck('booking', viewerActorId, identity?.kind);
  const viewerCanBook = isOwner || canCitizenBook(identity);
  const ownerActorId = profile?.actorId ?? profile?.actor_id ?? null;
  const profileId = profile?.id ?? null;
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [ownerCustomerName, setOwnerCustomerName] = useState("");
  const [ownerCustomerActorId, setOwnerCustomerActorId] = useState(null);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(null);
  const [viewMode, setViewMode] = useState("calendar");
  const [optimisticCancelledIds, setOptimisticCancelledIds] = useState([]);
  const [optimisticConfirmedIds, setOptimisticConfirmedIds] = useState([]);
  const ownerFollowerSearch = useSubscribers(ownerActorId, {
    limit: 200,
    offset: 0,
    enabled: Boolean(isOwner && ownerActorId),
  });

  const bookingContext = useBookingContextResolver({
    profileId,
    enabled: Boolean(profileId),
  });

  const resources = useOwnerBookingResources({
    ownerActorId,
    includeInactive: isOwner,
    enabled: Boolean(ownerActorId),
  });

  const resourceId = bookingContext.resource?.id ?? resources.primary?.id ?? null;
  const bookingLocationId = bookingContext.location?.id ?? null;
  const rangeStart = startOfMonth(monthCursor).toISOString();
  const rangeEnd = endOfMonth(monthCursor).toISOString();

  const availability = useBookingAvailability({
    resourceId,
    rangeStart,
    rangeEnd,
    publicMode: !isOwner,
    enabled: Boolean(resourceId),
  });

  const createBooking = useCreateBooking();
  const manageAvailability = useManageAvailability();
  const { bookings: rawBookings, rules, exceptions, serviceProfiles } = useAvailabilityData(availability);

  const bookings = useMemo(() => {
    let result = rawBookings;
    if (optimisticCancelledIds.length) {
      result = result.filter((b) => !optimisticCancelledIds.includes(b.id));
    }
    if (optimisticConfirmedIds.length) {
      result = result.map((b) =>
        optimisticConfirmedIds.includes(b.id) ? { ...b, status: "confirmed" } : b
      );
    }
    return result;
  }, [rawBookings, optimisticCancelledIds, optimisticConfirmedIds]);

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
  const selectedSlots = useMemo(
    () => slotsByDate[selectedDateKey] ?? [],
    [slotsByDate, selectedDateKey]
  );
  const {
    selectedOwnerFollower,
    ownerFollowerMatches,
    onOwnerCustomerNameChange,
    onSelectOwnerFollower,
    onClearOwnerFollower,
  } = useOwnerFollowerSelector({
    isOwner,
    ownerFollowerSearch,
    ownerCustomerName,
    ownerCustomerActorId,
    setOwnerCustomerName,
    setOwnerCustomerActorId,
  });

  const { agendaWeekLabel, weeklyAvailabilityDays, upcomingAppointments, monthStats } =
    useAgendaCalendarValues({
      selectedDateKey,
      rules,
      exceptions,
      occupiedIntervalsByDate,
      slotDurationMinutes,
      bookingsByDate,
      slotsByDate,
    });

  useEffect(() => {
    if (!selectedSlot) return;
    if (selectedSlots.includes(selectedSlot)) return;
    setSelectedSlot(null);
  }, [selectedSlot, selectedSlots]);

  useEffect(() => {
    if (!selectedSlot || !selectedDateKey) return;
    const checkExpiry = () => {
      if (isSlotExpired({ slotDate: selectedDateKey, slotStartTime: selectedSlot })) {
        setSelectedSlot(null);
      }
    };
    const interval = setInterval(checkExpiry, 30_000);
    return () => clearInterval(interval);
  }, [selectedSlot, selectedDateKey]);

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

  const mutations = useVportBookingMutations({
    isOwner,
    viewerActorId,
    viewerIdentityKind: identity?.kind ?? null,
    resourceId,
    locationId: bookingLocationId,
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
    setOptimisticCancelledIds,
    setOptimisticConfirmedIds,
  });

  return {
    viewerActorId,
    resources,
    bookingContext,
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
    viewerCanBook,
    canRequestSelectedSlot: viewerCanBook && (!isOwner || Boolean(viewerActorId)),
    isSelectedSlotAvailable: Boolean(selectedSlot) && selectedSlots.includes(selectedSlot),
    hasSelectedAvailableDay: Boolean(selectedDateKey) && Array.isArray(slotsByDate[selectedDateKey]) && slotsByDate[selectedDateKey].length > 0,
    upcomingAppointments,
    weeklyAvailabilityDays,
    agendaWeekLabel,
    onPrevMonth: () => setMonthCursor((prev) => shiftMonth(prev, -1)),
    onNextMonth: () => setMonthCursor((prev) => shiftMonth(prev, 1)),
    onSelectDate,
    onSelectSlot: (slotValue) => { if (!viewerCanBook) return; setSelectedSlot((prev) => (prev === slotValue ? null : slotValue)); },
    onChangeViewMode: setViewMode,
    onChangeDuration: setSelectedDurationMinutes,
    onOwnerCustomerNameChange,
    onSelectOwnerFollower,
    onClearOwnerFollower,
    onResetDay,
    ...mutations,
  };
}
