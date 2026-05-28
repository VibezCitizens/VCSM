import {
  fromDateKey,
  isSlotExpired,
  minutesToTime,
  normalizeDurationMinutes,
  startOfMonth,
  timeToMinutes,
  toDateKey,
} from "@/features/booking/model/bookingCalendarDate.model";

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
    const afterOccupied = removeBookedSlots(
      afterExceptions,
      occupiedIntervalsByDate[dateKey] ?? [],
      dateObj,
      slotDurationMinutes
    );
    slotsByDate[dateKey] = afterOccupied.filter(
      (slot) => !isSlotExpired({ slotDate: dateObj, slotStartTime: slot })
    );
  }

  return slotsByDate;
}
