import {
  addDays,
  formatDateLabel,
  fromDateKey,
  minutesToTime,
  normalizeDurationMinutes,
  timeToMinutes,
  toDateKey,
  toLocalDateLabel,
  toLocalTimeHHMM,
  WEEKDAY_LABELS,
  groupSlotsBySegment,
  startOfMonth,
} from "@/features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model";

const OCCUPYING_BOOKING_STATUSES = new Set([
  "pending",
  "confirmed",
  "completed",
  "hold",
  "no_show",
]);

export function buildRuleSlotsForDate(rules, dateObj, slotDurationMinutes = 30) {
  const weekday = dateObj.getDay();
  const dateKey = toDateKey(dateObj);
  const slotSet = new Set();
  const stepMinutes = normalizeDurationMinutes(slotDurationMinutes, 30);

  (Array.isArray(rules) ? rules : []).forEach((rule) => {
    if (Number(rule?.weekday) !== weekday) return;
    if (rule?.isActive === false) return;
    if (rule?.validFrom && dateKey < String(rule.validFrom)) return;
    if (rule?.validUntil && dateKey > String(rule.validUntil)) return;

    const start = timeToMinutes(rule?.startTime);
    const end = timeToMinutes(rule?.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;

    for (let value = start; value < end; value += stepMinutes) {
      slotSet.add(minutesToTime(value));
    }
  });

  return [...slotSet].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

export function applyExceptionsToSlots(slots, exceptions, dateObj) {
  const dateKey = toDateKey(dateObj);

  return (Array.isArray(slots) ? slots : []).filter((slot) => {
    const slotDate = fromDateKey(dateKey);
    const [hours = "0", minutes = "0"] = String(slot).split(":");
    slotDate.setHours(Number(hours), Number(minutes), 0, 0);
    const slotTs = slotDate.getTime();

    for (const exception of Array.isArray(exceptions) ? exceptions : []) {
      const startTs = new Date(exception?.startsAt).getTime();
      const endTs = new Date(exception?.endsAt).getTime();
      if (!Number.isFinite(startTs) || !Number.isFinite(endTs)) continue;
      if (slotTs >= startTs && slotTs < endTs) return false;
    }

    return true;
  });
}

export function buildOccupiedIntervalsByDate(bookings) {
  const intervalsByDate = {};

  (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
    const status = String(booking?.status || "").toLowerCase();
    if (!OCCUPYING_BOOKING_STATUSES.has(status)) return;

    const startTs = new Date(booking?.startsAt).getTime();
    const endTs = new Date(booking?.endsAt).getTime();
    if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) return;

    const dateKey = toDateKey(new Date(startTs));
    if (!dateKey) return;
    if (!intervalsByDate[dateKey]) intervalsByDate[dateKey] = [];
    intervalsByDate[dateKey].push({ startTs, endTs });
  });

  return intervalsByDate;
}

export function removeBookedSlots(slots, occupiedIntervals, dateObj, slotDurationMinutes = 30) {
  const intervals = Array.isArray(occupiedIntervals) ? occupiedIntervals : [];
  if (!intervals.length) return Array.isArray(slots) ? slots : [];

  const slotDurationMs = normalizeDurationMinutes(slotDurationMinutes, 30) * 60 * 1000;
  return (Array.isArray(slots) ? slots : []).filter((slot) => {
    const slotDate = new Date(dateObj);
    const [hours = "0", minutes = "0"] = String(slot).split(":");
    slotDate.setHours(Number(hours), Number(minutes), 0, 0);
    const slotStartTs = slotDate.getTime();
    const slotEndTs = slotStartTs + slotDurationMs;

    return !intervals.some(
      (interval) =>
        Number.isFinite(interval?.startTs) &&
        Number.isFinite(interval?.endTs) &&
        slotStartTs < interval.endTs &&
        slotEndTs > interval.startTs
    );
  });
}

export function buildBookingsByDate(bookings, { isOwner = false } = {}) {
  const bookingsByDate = {};

  (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
    const startsAt = booking?.startsAt;
    if (!startsAt) return;

    const status = String(booking?.status || "pending").toLowerCase();
    if (!isOwner && status === "cancelled") return;

    const source = String(booking?.source || "public").toLowerCase();
    const fallbackName = source === "public" ? "Citizen" : "Customer";
    const customerActorId =
      booking?.customerActorId ?? (source === "public" ? booking?.createdByActorId ?? null : null);

    const startsAtDate = new Date(startsAt);
    if (Number.isNaN(startsAtDate.getTime())) return;

    const dateKey = toDateKey(startsAtDate);
    if (!bookingsByDate[dateKey]) bookingsByDate[dateKey] = [];
    bookingsByDate[dateKey].push({
      id: booking?.id ?? `${dateKey}:${booking?.status ?? "pending"}`,
      time: toLocalTimeHHMM(startsAt),
      dateLabel: toLocalDateLabel(startsAt),
      clientName: isOwner ? booking?.customerName || fallbackName : "Reserved",
      customerActorId,
      service: isOwner ? booking?.serviceLabelSnapshot || "Booking" : "Appointment",
      status,
      startsAtTs: startsAtDate.getTime(),
    });
  });

  Object.keys(bookingsByDate).forEach((dateKey) => {
    bookingsByDate[dateKey].sort((a, b) => String(a.time).localeCompare(String(b.time)));
  });

  return bookingsByDate;
}

export function buildSlotsByDate({
  monthCursor,
  rules,
  exceptions,
  occupiedIntervalsByDate,
  slotDurationMinutes,
}) {
  const slotsByDate = {};
  const monthStart = startOfMonth(monthCursor);

  for (let day = 1; day <= 31; day += 1) {
    const dateObj = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    if (dateObj.getMonth() !== monthStart.getMonth()) break;

    const dateKey = toDateKey(dateObj);
    const rawSlots = buildRuleSlotsForDate(rules, dateObj, slotDurationMinutes);
    const afterExceptions = applyExceptionsToSlots(rawSlots, exceptions, dateObj);
    slotsByDate[dateKey] = removeBookedSlots(
      afterExceptions,
      occupiedIntervalsByDate[dateKey] ?? [],
      dateObj,
      slotDurationMinutes
    );
  }

  return slotsByDate;
}

export function buildMonthCells({ monthDate, selectedDateKey, bookingsByDate, slotsByDate }) {
  const firstOfMonth = startOfMonth(monthDate);
  const daysInMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
  const leadingEmptyCount = firstOfMonth.getDay();
  const totalVisibleCount = leadingEmptyCount + daysInMonth;
  const trailingEmptyCount = (7 - (totalVisibleCount % 7)) % 7;
  const todayKey = toDateKey(new Date());
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const cells = [];
  for (let index = 0; index < leadingEmptyCount; index += 1) {
    cells.push({ key: `empty-leading-${index}`, isPlaceholder: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateObj = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), day);
    const dayStart = new Date(dateObj);
    dayStart.setHours(0, 0, 0, 0);
    const dateKey = toDateKey(dateObj);
    const appointments = bookingsByDate[dateKey] ?? [];
    const slots = slotsByDate[dateKey] ?? [];
    const confirmedCount = appointments.filter((item) =>
      ["confirmed", "completed"].includes(item.status)
    ).length;
    const pendingCount = appointments.filter((item) => item.status === "pending").length;
    const isPast = dayStart.getTime() < todayStart.getTime();
    const isClosed = slots.length === 0;
    const isDisabled = isPast || isClosed;

    let availabilityLevel = "none";
    if (slots.length >= 14) availabilityLevel = "high";
    else if (slots.length >= 8) availabilityLevel = "medium";
    else if (slots.length > 0) availabilityLevel = "low";

    cells.push({
      key: dateKey,
      dateKey,
      dayNumber: dateObj.getDate(),
      isCurrentMonth: true,
      isPlaceholder: false,
      isSelected: !isDisabled && dateKey === selectedDateKey,
      isToday: dateKey === todayKey,
      isPast,
      isClosed,
      isDisabled,
      openSlotCount: slots.length,
      appointmentCount: appointments.length,
      confirmedCount,
      pendingCount,
      availabilityLevel,
      ariaLabel: `${WEEKDAY_LABELS[dateObj.getDay()]} ${dateObj.getDate()}`,
    });
  }

  for (let index = 0; index < trailingEmptyCount; index += 1) {
    cells.push({ key: `empty-trailing-${index}`, isPlaceholder: true });
  }

  return cells;
}

export function buildWeeklyAvailabilityDays({
  agendaWeekStart,
  rules,
  exceptions,
  occupiedIntervalsByDate,
  slotDurationMinutes,
}) {
  return Array.from({ length: 7 }, (_, index) => {
    const dateObj = addDays(agendaWeekStart, index);
    const dateKey = toDateKey(dateObj);
    const rawSlots = buildRuleSlotsForDate(rules, dateObj, slotDurationMinutes);
    const afterExceptions = applyExceptionsToSlots(rawSlots, exceptions, dateObj);
    const openSlots = removeBookedSlots(
      afterExceptions,
      occupiedIntervalsByDate[dateKey] ?? [],
      dateObj,
      slotDurationMinutes
    );

    return {
      id: dateKey,
      dateLabel: formatDateLabel(dateKey),
      totalSlots: openSlots.length,
      slotsBySegment: groupSlotsBySegment(openSlots),
    };
  });
}

export function buildUpcomingAppointments(bookingsByDate) {
  const now = Date.now();
  const flattened = Object.values(bookingsByDate || {}).flat();
  return flattened
    .filter((item) => Number.isFinite(item.startsAtTs) && item.startsAtTs >= now)
    .sort((a, b) => a.startsAtTs - b.startsAtTs)
    .slice(0, 10);
}

export function buildMonthStats({ slotsByDate, bookingsByDate }) {
  const openSlots = Object.values(slotsByDate || {}).reduce(
    (sum, slots) => sum + (slots?.length ?? 0),
    0
  );
  const allBookings = Object.values(bookingsByDate || {}).flat();
  const bookedCount = allBookings.filter((item) =>
    ["pending", "confirmed", "completed"].includes(item.status)
  ).length;
  const pendingCount = allBookings.filter((item) => item.status === "pending").length;
  return { openSlots, bookedCount, pendingCount };
}

export function buildCustomerActorRows(bookings) {
  return (Array.isArray(bookings) ? bookings : [])
    .map((booking) => {
      const source = String(booking?.source || "").toLowerCase();
      return booking?.customerActorId ?? (source === "public" ? booking?.createdByActorId ?? null : null);
    })
    .filter(Boolean)
    .map((actorId) => ({ actor_id: actorId }));
}
