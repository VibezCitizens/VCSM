import { useCallback, useMemo, useState } from "react";

import { BookingCalendarAgendaPanel } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarAgendaPanel";
import { BookingCalendarDayPanel } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarDayPanel";
import { BookingCalendarMonthGrid } from "@/features/profiles/kinds/vport/screens/booking/components/BookingCalendarMonthGrid";
import {
  useBookingAvailability,
  useCreateBooking,
  useOwnerBookingResources,
} from "@/features/booking/adapters/booking.adapter";
import "@/features/profiles/styles/profiles-booking-modern.css";
import "@/features/profiles/styles/profiles-booking-daypanel-modern.css";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
  hold: "Hold",
};

const SEGMENT_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function fromDateKey(key) {
  const [year, month, day] = String(key || "").split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function shiftMonth(date, offset) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + Number(offset || 0));
  return startOfMonth(next);
}

function startOfWeek(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return startOfMonth(new Date());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return new Date();
  d.setDate(d.getDate() + Number(amount || 0));
  return d;
}

function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatDateLabel(dateKey) {
  const d = fromDateKey(dateKey);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function timeToMinutes(value) {
  const [h = "0", m = "0"] = String(value || "").split(":");
  return Number(h) * 60 + Number(m);
}

function minutesToTime(value) {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function toLocalTimeHHMM(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "00:00";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toLocalDateLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupSlotsBySegment(slots) {
  const groups = { morning: [], afternoon: [], evening: [] };
  for (const slot of Array.isArray(slots) ? slots : []) {
    const minutes = timeToMinutes(slot);
    if (minutes < 12 * 60) groups.morning.push(slot);
    else if (minutes < 17 * 60) groups.afternoon.push(slot);
    else groups.evening.push(slot);
  }
  return groups;
}

function normalizeDurationMinutes(value, fallback = 30) {
  const duration = Math.floor(Number(value));
  if (!Number.isFinite(duration) || duration < 5) return fallback;
  return Math.min(240, duration);
}

function buildRuleSlotsForDate(rules, dateObj, slotDurationMinutes = 30) {
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

function applyExceptionsToSlots(slots, exceptions, dateObj) {
  const key = toDateKey(dateObj);

  return (Array.isArray(slots) ? slots : []).filter((slot) => {
    const slotDate = fromDateKey(key);
    const [h = "0", m = "0"] = String(slot).split(":");
    slotDate.setHours(Number(h), Number(m), 0, 0);
    const slotTs = slotDate.getTime();

    for (const ex of Array.isArray(exceptions) ? exceptions : []) {
      const startTs = new Date(ex?.startsAt).getTime();
      const endTs = new Date(ex?.endsAt).getTime();
      if (!Number.isFinite(startTs) || !Number.isFinite(endTs)) continue;
      if (slotTs >= startTs && slotTs < endTs) return false;
    }

    return true;
  });
}

function buildMonthCells({ monthDate, selectedDateKey, bookingsByDate, slotsByDate }) {
  const firstOfMonth = startOfMonth(monthDate);
  const daysInMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
  const leadingEmptyCount = firstOfMonth.getDay();
  const totalVisibleCount = leadingEmptyCount + daysInMonth;
  const trailingEmptyCount = (7 - (totalVisibleCount % 7)) % 7;
  const todayKey = toDateKey(new Date());
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = 0; i < leadingEmptyCount; i += 1) {
    cells.push({
      key: `empty-leading-${i}`,
      isPlaceholder: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), day);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dateKey = toDateKey(d);
    const appts = bookingsByDate[dateKey] ?? [];
    const slots = slotsByDate[dateKey] ?? [];
    const confirmedCount = appts.filter((x) => ["confirmed", "completed"].includes(x.status)).length;
    const pendingCount = appts.filter((x) => x.status === "pending").length;
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
      dayNumber: d.getDate(),
      isCurrentMonth: true,
      isPlaceholder: false,
      isSelected: !isDisabled && dateKey === selectedDateKey,
      isToday: dateKey === todayKey,
      isPast,
      isClosed,
      isDisabled,
      openSlotCount: slots.length,
      appointmentCount: appts.length,
      confirmedCount,
      pendingCount,
      availabilityLevel,
      ariaLabel: `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()}`,
    });
  }

  for (let i = 0; i < trailingEmptyCount; i += 1) {
    cells.push({
      key: `empty-trailing-${i}`,
      isPlaceholder: true,
    });
  }

  return cells;
}

export default function VportBookingView({ profile, isOwner = false }) {
  const ownerActorId = profile?.actorId ?? profile?.actor_id ?? null;
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
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

  const slotDurationMinutes = useMemo(() => {
    const firstProfileWithDuration = serviceProfiles.find((profile) =>
      Number.isFinite(Number(profile?.durationMinutes)) && Number(profile.durationMinutes) > 0
    );
    return normalizeDurationMinutes(firstProfileWithDuration?.durationMinutes, 30);
  }, [serviceProfiles]);

  const bookingsByDate = useMemo(() => {
    const out = {};
    (Array.isArray(bookings) ? bookings : []).forEach((b) => {
      const startsAt = b?.startsAt;
      if (!startsAt) return;

      const d = new Date(startsAt);
      if (Number.isNaN(d.getTime())) return;
      const dateKey = toDateKey(d);
      if (!out[dateKey]) out[dateKey] = [];

      out[dateKey].push({
        id: b?.id ?? `${dateKey}:${b?.status ?? "pending"}`,
        time: toLocalTimeHHMM(startsAt),
        dateLabel: toLocalDateLabel(startsAt),
        clientName: isOwner ? b?.customerName || "Customer" : "Reserved",
        service: isOwner ? b?.serviceLabelSnapshot || "Booking" : "Appointment",
        status: b?.status || "pending",
        startsAtTs: d.getTime(),
      });
    });

    Object.keys(out).forEach((key) => {
      out[key].sort((a, b) => String(a.time).localeCompare(String(b.time)));
    });

    return out;
  }, [bookings, isOwner]);

  const slotsByDate = useMemo(() => {
    const out = {};
    const monthStart = startOfMonth(monthCursor);

    for (let day = 1; day <= 31; day += 1) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      if (d.getMonth() !== monthStart.getMonth()) break;

      const dateKey = toDateKey(d);
      const rawSlots = buildRuleSlotsForDate(rules, d, slotDurationMinutes);
      out[dateKey] = applyExceptionsToSlots(rawSlots, exceptions, d);
    }

    return out;
  }, [monthCursor, rules, exceptions, slotDurationMinutes]);

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

  const agendaWeekAnchor = useMemo(() => {
    const selectedDate = selectedDateKey ? fromDateKey(selectedDateKey) : null;
    if (selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())) return selectedDate;
    return new Date();
  }, [selectedDateKey]);

  const agendaWeekStart = useMemo(() => startOfWeek(agendaWeekAnchor), [agendaWeekAnchor]);

  const agendaWeekLabel = useMemo(() => {
    const weekStart = agendaWeekStart;
    const weekEnd = addDays(agendaWeekStart, 6);
    const startLabel = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endLabel = weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${startLabel} - ${endLabel}`;
  }, [agendaWeekStart]);

  const weeklyAvailabilityDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const dateObj = addDays(agendaWeekStart, index);
      const dateKey = toDateKey(dateObj);
      const rawSlots = buildRuleSlotsForDate(rules, dateObj, slotDurationMinutes);
      const openSlots = applyExceptionsToSlots(rawSlots, exceptions, dateObj);

      return {
        id: dateKey,
        dateLabel: formatDateLabel(dateKey),
        totalSlots: openSlots.length,
        slotsBySegment: groupSlotsBySegment(openSlots),
      };
    });
  }, [agendaWeekStart, rules, exceptions, slotDurationMinutes]);

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    const flat = Object.values(bookingsByDate).flat();
    return flat
      .filter((x) => Number.isFinite(x.startsAtTs) && x.startsAtTs >= now)
      .sort((a, b) => a.startsAtTs - b.startsAtTs)
      .slice(0, 10);
  }, [bookingsByDate]);

  const monthStats = useMemo(() => {
    const openSlots = Object.values(slotsByDate).reduce((sum, items) => sum + (items?.length ?? 0), 0);
    const allBookings = Object.values(bookingsByDate).flat();
    const bookedCount = allBookings.filter((x) => ["pending", "confirmed", "completed"].includes(x.status)).length;
    const pendingCount = allBookings.filter((x) => x.status === "pending").length;

    return { openSlots, bookedCount, pendingCount };
  }, [slotsByDate, bookingsByDate]);

  const onCreateAppointmentFromSelectedSlot = useCallback(async () => {
    if (!resourceId || !selectedSlot || isOwner) return;

    const d = fromDateKey(selectedDateKey);
    const [h = "0", m = "0"] = String(selectedSlot).split(":");
    d.setHours(Number(h), Number(m), 0, 0);
    const end = new Date(d.getTime() + slotDurationMinutes * 60 * 1000);

    await createBooking.createBooking({
      requestActorId: null,
      resourceId,
      source: "public",
      status: "pending",
      startsAt: d.toISOString(),
      endsAt: end.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      serviceLabelSnapshot: "Requested appointment",
      durationMinutes: slotDurationMinutes,
      customerName: null,
      customerNote: null,
    });

    await availability.refresh();
  }, [
    resourceId,
    selectedSlot,
    selectedDateKey,
    createBooking,
    availability,
    isOwner,
    slotDurationMinutes,
  ]);

  const monthLabel = formatMonthLabel(monthCursor);
  const selectedDateLabel = formatDateLabel(selectedDateKey);
  const selectedSlotsBySegment = groupSlotsBySegment(selectedSlots);
  const hasSelectedAvailableDay =
    Boolean(selectedDateKey) && Array.isArray(slotsByDate[selectedDateKey]) && slotsByDate[selectedDateKey].length > 0;

  return (
    <section className="profiles-card profiles-booking-shell p-4 sm:p-5">
      <header className="profiles-booking-header">
        <div>
          <p className="profiles-booking-kicker">Appointments & Availability</p>
          <h3 className="profiles-booking-title">Calendar</h3>
          <p className="profiles-booking-subtitle">
            Booking availability for @{profile?.username || "barber"}.
          </p>
        </div>
      </header>

      {resources.error ? (
        <div className="profiles-error mt-3 rounded-2xl p-3 text-sm">
          {String(resources.error?.message ?? resources.error)}
        </div>
      ) : null}

      {availability.error ? (
        <div className="profiles-error mt-3 rounded-2xl p-3 text-sm">
          {String(availability.error?.message ?? availability.error)}
        </div>
      ) : null}

      <div className="profiles-booking-stats-grid">
        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">Open Slots</p>
          <p className="profiles-booking-stat-value">{monthStats.openSlots}</p>
        </article>

        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">Booked</p>
          <p className="profiles-booking-stat-value">{monthStats.bookedCount}</p>
        </article>

        <article className="profiles-booking-stat-card">
          <p className="profiles-booking-stat-label">Pending</p>
          <p className="profiles-booking-stat-value">{monthStats.pendingCount}</p>
        </article>
      </div>

      <div className="profiles-booking-view-switch" role="tablist" aria-label="Calendar view mode">
        <button
          type="button"
          className={`profiles-booking-view-btn ${viewMode === "calendar" ? "is-active" : ""}`}
          onClick={() => setViewMode("calendar")}
          role="tab"
          aria-selected={viewMode === "calendar"}
        >
          Calendar
        </button>

        <button
          type="button"
          className={`profiles-booking-view-btn ${viewMode === "agenda" ? "is-active" : ""}`}
          onClick={() => setViewMode("agenda")}
          role="tab"
          aria-selected={viewMode === "agenda"}
        >
          Agenda
        </button>
      </div>

      {viewMode === "calendar" && (
        <BookingCalendarMonthGrid
          monthLabel={monthLabel}
          weekdayLabels={WEEKDAY_LABELS}
          monthCells={monthCells}
          onPrevMonth={() => setMonthCursor((prev) => shiftMonth(prev, -1))}
          onNextMonth={() => setMonthCursor((prev) => shiftMonth(prev, 1))}
          onSelectDate={(dateKey) => {
            const picked = fromDateKey(dateKey);
            picked.setHours(0, 0, 0, 0);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (picked.getTime() < now.getTime()) return;
            if ((slotsByDate[dateKey] ?? []).length === 0) return;
            setSelectedDateKey(dateKey);
            setSelectedSlot(null);
          }}
        />
      )}

      {viewMode === "calendar" && hasSelectedAvailableDay ? (
        <BookingCalendarDayPanel
          isOwner={isOwner}
          canRequestSelectedSlot={!isOwner}
          showOwnerSlotActions={false}
          selectedDateLabel={selectedDateLabel}
          selectedSlot={selectedSlot}
          selectedSlotsBySegment={selectedSlotsBySegment}
          selectedAppointments={selectedAppointments}
          segmentLabels={SEGMENT_LABELS}
          statusLabels={STATUS_LABELS}
          isSelectedSlotAvailable={Boolean(selectedSlot) && selectedSlots.includes(selectedSlot)}
          onSelectSlot={(slotValue) =>
            setSelectedSlot((prev) => (prev === slotValue ? null : slotValue))
          }
          onCreateAppointmentFromSelectedSlot={onCreateAppointmentFromSelectedSlot}
          onToggleAvailabilityForSelectedSlot={() => {}}
          onResetDay={() => {
            setSelectedSlot(null);
            setSelectedDateKey(null);
          }}
        />
      ) : (
        viewMode === "agenda" && (
          <BookingCalendarAgendaPanel
            upcomingAppointments={upcomingAppointments}
            weeklyAvailabilityDays={weeklyAvailabilityDays}
            weekLabel={agendaWeekLabel}
            segmentLabels={SEGMENT_LABELS}
            statusLabels={STATUS_LABELS}
            isOwner={isOwner}
          />
        )
      )}
    </section>
  );
}
