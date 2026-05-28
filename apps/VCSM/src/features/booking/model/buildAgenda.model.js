import {
  addDays,
  formatDateLabel,
  groupSlotsBySegment,
  isSlotExpired,
  toDateKey,
} from "@/features/booking/model/bookingCalendarDate.model";
import {
  applyExceptionsToSlots,
  buildRuleSlotsForDate,
  removeBookedSlots,
} from "@/features/booking/model/buildSlots.model";

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
    const afterOccupied = removeBookedSlots(
      afterExceptions,
      occupiedIntervalsByDate[dateKey] ?? [],
      dateObj,
      slotDurationMinutes
    );
    const openSlots = afterOccupied.filter(
      (slot) => !isSlotExpired({ slotDate: dateObj, slotStartTime: slot })
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
