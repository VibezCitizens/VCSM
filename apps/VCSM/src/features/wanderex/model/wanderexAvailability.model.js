import {
  toDateKey,
  fromDateKey,
  minutesFromTime,
  timeFromMinutes,
  weekdayToIndex,
} from "./wanderexPublic.model";

function normalizeRuleWindow(rule, dateKey) {
  const weekday = weekdayToIndex(rule?.weekday);
  const startMinutes = minutesFromTime(rule?.start_time ?? rule?.startTime);
  const endMinutes = minutesFromTime(rule?.end_time ?? rule?.endTime);

  if (!Number.isFinite(weekday) || !Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
    return null;
  }

  if (endMinutes <= startMinutes) return null;

  const validFrom = String(rule?.valid_from ?? rule?.validFrom ?? "").slice(0, 10);
  const validUntil = String(rule?.valid_until ?? rule?.validUntil ?? "").slice(0, 10);

  if (validFrom && dateKey < validFrom) return null;
  if (validUntil && dateKey > validUntil) return null;

  return { weekday, startMinutes, endMinutes };
}

function mergeIntervals(intervals) {
  if (!Array.isArray(intervals) || !intervals.length) return [];

  const sorted = intervals
    .map((it) => ({ start: Number(it.start), end: Number(it.end) }))
    .filter((it) => Number.isFinite(it.start) && Number.isFinite(it.end) && it.end > it.start)
    .sort((a, b) => a.start - b.start);

  if (!sorted.length) return [];

  const output = [sorted[0]];
  for (let i = 1; i < sorted.length; i += 1) {
    const last = output[output.length - 1];
    const current = sorted[i];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      output.push(current);
    }
  }

  return output;
}

function subtractIntervals(baseIntervals, blockedIntervals) {
  const mergedBase = mergeIntervals(baseIntervals);
  const mergedBlocked = mergeIntervals(blockedIntervals);
  if (!mergedBase.length) return [];
  if (!mergedBlocked.length) return mergedBase;

  const output = [];

  mergedBase.forEach((base) => {
    let cursor = base.start;

    mergedBlocked.forEach((blocked) => {
      if (blocked.end <= cursor) return;
      if (blocked.start >= base.end) return;

      if (blocked.start > cursor) {
        output.push({ start: cursor, end: Math.min(blocked.start, base.end) });
      }

      cursor = Math.max(cursor, blocked.end);
    });

    if (cursor < base.end) {
      output.push({ start: cursor, end: base.end });
    }
  });

  return mergeIntervals(output);
}

export function buildAvailabilityCalendarByResource({
  rules,
  bookings,
  resources,
  startDate,
  days = 14,
}) {
  const safeDays = Math.max(1, Math.min(31, Number(days) || 14));
  const baseDate = startDate instanceof Date ? new Date(startDate) : new Date();
  baseDate.setHours(0, 0, 0, 0);

  const bookingsByResourceDate = {};
  (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
    const resourceId = booking?.resource_id;
    if (!resourceId) return;

    const startAt = new Date(booking?.starts_at).getTime();
    const endAt = new Date(booking?.ends_at).getTime();
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) return;

    const dateKey = toDateKey(new Date(startAt));
    if (!dateKey) return;

    const start = new Date(startAt);
    const end = new Date(endAt);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    bookingsByResourceDate[resourceId] = bookingsByResourceDate[resourceId] || {};
    bookingsByResourceDate[resourceId][dateKey] = bookingsByResourceDate[resourceId][dateKey] || [];
    bookingsByResourceDate[resourceId][dateKey].push({
      id: booking.id,
      status: booking.status,
      startMinutes,
      endMinutes,
      startsAt: booking.starts_at,
      endsAt: booking.ends_at,
      serviceLabel: booking.service_label_snapshot || "Appointment",
      customerName: booking.customer_name || "Client",
    });
  });

  const rulesByResource = {};
  (Array.isArray(rules) ? rules : []).forEach((rule) => {
    const resourceId = rule?.resource_id;
    if (!resourceId) return;
    if (rule?.is_active === false) return;

    rulesByResource[resourceId] = rulesByResource[resourceId] || [];
    rulesByResource[resourceId].push(rule);
  });

  const calendarByResource = {};

  (Array.isArray(resources) ? resources : []).forEach((resource) => {
    const resourceId = resource.id;
    const resourceRules = rulesByResource[resourceId] || [];
    const calendarByDate = {};

    for (let offset = 0; offset < safeDays; offset += 1) {
      const day = new Date(baseDate);
      day.setDate(baseDate.getDate() + offset);
      const dateKey = toDateKey(day);
      const weekday = day.getDay();

      const ruleWindows = resourceRules
        .map((rule) => normalizeRuleWindow(rule, dateKey))
        .filter(Boolean)
        .filter((window) => window.weekday === weekday)
        .map((window) => ({ start: window.startMinutes, end: window.endMinutes }));

      const bookedWindows = (bookingsByResourceDate[resourceId]?.[dateKey] || []).map((booking) => ({
        start: booking.startMinutes,
        end: booking.endMinutes,
      }));

      const openIntervals = subtractIntervals(ruleWindows, bookedWindows);

      calendarByDate[dateKey] = {
        dateKey,
        openIntervals,
        ruleWindows: mergeIntervals(ruleWindows),
        bookedWindows: mergeIntervals(bookedWindows),
        bookings: bookingsByResourceDate[resourceId]?.[dateKey] || [],
      };
    }

    calendarByResource[resourceId] = calendarByDate;
  });

  return calendarByResource;
}

export function buildBookableStartTimes({ openIntervals, durationMinutes, stepMinutes = 15 }) {
  const duration = Math.max(stepMinutes, Number(durationMinutes) || 30);
  const step = Math.max(5, Number(stepMinutes) || 15);
  const starts = [];

  mergeIntervals(openIntervals).forEach((window) => {
    for (let point = window.start; point + duration <= window.end; point += step) {
      starts.push(point);
    }
  });

  return starts;
}

export function hasOpenNow(calendarByDate) {
  const now = new Date();
  const dateKey = toDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const day = calendarByDate?.[dateKey];
  if (!day) return false;

  return (day.openIntervals || []).some(
    (window) => currentMinutes >= window.start && currentMinutes < window.end
  );
}

export function buildNextSlotsForResource({ calendarByDate, durationMinutes, limit = 3 }) {
  const next = [];
  const keys = Object.keys(calendarByDate || {}).sort();

  keys.some((dateKey) => {
    const starts = buildBookableStartTimes({
      openIntervals: calendarByDate[dateKey]?.openIntervals || [],
      durationMinutes,
      stepMinutes: 15,
    });

    starts.forEach((start) => {
      if (next.length >= limit) return;
      const date = fromDateKey(dateKey);
      if (!date) return;
      date.setHours(Math.floor(start / 60), start % 60, 0, 0);
      if (date.getTime() < Date.now()) return;

      next.push({
        dateKey,
        startMinutes: start,
        time: timeFromMinutes(start),
        iso: date.toISOString(),
      });
    });

    return next.length >= limit;
  });

  return next;
}

export function findFirstBookableStartInRange({
  openIntervals,
  rangeStartMinutes,
  rangeEndMinutes,
  durationMinutes,
  stepMinutes = 15,
}) {
  const duration = Math.max(15, Number(durationMinutes) || 30);
  const step = Math.max(5, Number(stepMinutes) || 15);
  const min = Math.min(rangeStartMinutes, rangeEndMinutes);
  const max = Math.max(rangeStartMinutes, rangeEndMinutes);

  const starts = buildBookableStartTimes({
    openIntervals,
    durationMinutes: duration,
    stepMinutes: step,
  });

  const within = starts.find((value) => value >= min && value + duration <= max);
  return Number.isFinite(within) ? within : null;
}

export function buildBookingLeadMessage({
  profile,
  service,
  barber,
  dateKey,
  startMinutes,
  durationMinutes,
  customerName,
  customerPhone,
  customerEmail,
  note,
}) {
  const date = fromDateKey(dateKey);
  const startTime = timeFromMinutes(startMinutes);
  const endTime = timeFromMinutes(startMinutes + durationMinutes);
  const prettyDate = date
    ? date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : dateKey;

  return [
    `Booking request for ${profile?.name || "this provider"}`,
    `Service: ${service?.label || "General request"}`,
    `Preferred barber: ${barber?.name || "Auto-assign"}`,
    `Preferred time: ${prettyDate}, ${startTime} - ${endTime}`,
    `Customer: ${customerName}`,
    customerPhone ? `Phone: ${customerPhone}` : null,
    customerEmail ? `Email: ${customerEmail}` : null,
    note ? `Notes: ${note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
