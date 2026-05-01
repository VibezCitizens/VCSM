import {
  startOfMonth,
  toDateKey,
  toLocalDateLabel,
  toLocalTimeHHMM,
  WEEKDAY_LABELS,
} from "@/features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model";

const OCCUPYING_BOOKING_STATUSES = new Set([
  "pending",
  "confirmed",
  "completed",
  "hold",
  "no_show",
]);

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
      clientName: booking?.customerName || fallbackName,
      customerActorId,
      service: booking?.serviceLabelSnapshot || "Appointment",
      status,
      startsAtTs: startsAtDate.getTime(),
    });
  });

  Object.keys(bookingsByDate).forEach((dateKey) => {
    bookingsByDate[dateKey].sort((a, b) => String(a.time).localeCompare(String(b.time)));
  });

  return bookingsByDate;
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
