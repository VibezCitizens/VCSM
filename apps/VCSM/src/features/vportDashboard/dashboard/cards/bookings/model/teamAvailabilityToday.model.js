// Normalizes loadDayScheduleController lanes into a read-only "Team available today"
// view model. The schedule controller already owns resource discovery, availability_rules
// loading, ownership gating, and weekday filtering — this layer only formats each lane's
// day rules into display ranges, totals, and open/closed status. No DB access here.

// Default appointment length when no service duration is selected.
export const DEFAULT_SLOT_MINUTES = 30;

// A slot is unavailable only if it overlaps a booking in one of these states.
// Cancelled/no_show are already excluded at the DAL; completed does not block.
const BLOCKING_STATUSES = new Set(["pending", "confirmed", "hold"]);

// Convert a booking row into a minutes-of-day interval, using the browser-local clock —
// the same basis QuickBookingModal uses to build starts_at/ends_at and the same basis
// the slot chips are rendered in, so overlaps line up.
function bookingToInterval(b) {
  const start = b?.starts_at ? new Date(b.starts_at) : null;
  if (!start || Number.isNaN(start.getTime())) return null;
  const startMin = start.getHours() * 60 + start.getMinutes();

  let endMin = null;
  if (b?.ends_at) {
    const end = new Date(b.ends_at);
    if (!Number.isNaN(end.getTime())) endMin = end.getHours() * 60 + end.getMinutes();
  }
  if (endMin == null) {
    const dur = Number(b?.duration_minutes);
    endMin = Number.isFinite(dur) && dur > 0 ? startMin + dur : startMin + DEFAULT_SLOT_MINUTES;
  }
  if (endMin <= startMin) return null;
  return { startMin, endMin };
}

function buildOccupiedIntervals(bookings) {
  if (!Array.isArray(bookings)) return [];
  return bookings
    .filter((b) => BLOCKING_STATUSES.has(String(b?.status)))
    .map(bookingToInterval)
    .filter(Boolean);
}

function overlapsAny(slotStart, slotEnd, occupied) {
  return occupied.some((iv) => slotStart < iv.endMin && iv.startMin < slotEnd);
}

function timeStrToMinutes(t) {
  if (!t) return null;
  const [h, m] = String(t).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function minutesToTimeStr(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Generate bookable slot starts inside [startMin, endMin), stepping by slotMinutes.
// Slots whose end would fall outside the range, or that overlap an occupied interval,
// are excluded.
function buildSlots(startMin, endMin, occupied = [], slotMinutes = DEFAULT_SLOT_MINUTES) {
  const slots = [];
  for (let s = startMin; s + slotMinutes <= endMin; s += slotMinutes) {
    const e = s + slotMinutes;
    if (overlapsAny(s, e, occupied)) continue;
    slots.push({
      startMin: s,
      endMin: e,
      start: minutesToTimeStr(s),     // "HH:MM" — modal date/time input format
      end: minutesToTimeStr(e),       // "HH:MM"
      durationMinutes: slotMinutes,
      label: formatTimeLabel(minutesToTimeStr(s)),
    });
  }
  return slots;
}

// Compact 12h label, e.g. "9 AM", "9:30 AM". Accepts "HH:MM" or "HH:MM:SS".
function formatTimeLabel(t) {
  const mins = timeStrToMinutes(t);
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// Map one schedule lane → availability summary for the selected day.
export function mapLaneToAvailability(lane) {
  const resource = lane?.resource ?? {};
  const dayRules = Array.isArray(lane?.dayRules) ? lane.dayRules : [];
  const occupied = buildOccupiedIntervals(lane?.bookings);

  const ranges = dayRules
    .map((r) => {
      const startMin = timeStrToMinutes(r.start_time);
      const endMin = timeStrToMinutes(r.end_time);
      return {
        start: r.start_time ?? null,
        end: r.end_time ?? null,
        startMin,
        endMin,
        label: `${formatTimeLabel(r.start_time)} – ${formatTimeLabel(r.end_time)}`,
        slots:
          startMin != null && endMin != null && endMin > startMin
            ? buildSlots(startMin, endMin, occupied)
            : [],
      };
    })
    .filter((x) => x.startMin != null && x.endMin != null && x.endMin > x.startMin)
    .sort((a, b) => a.startMin - b.startMin);

  const totalMinutes = ranges.reduce((sum, r) => sum + (r.endMin - r.startMin), 0);

  return {
    resourceId: resource.id ?? null,
    name: resource.name ?? "Unnamed",
    isOpen: ranges.length > 0,
    ranges,
    totalMinutes,
  };
}

// Map all lanes → active members with their availability for the day.
// Lanes from loadDayScheduleController are already active-only; the is_active guard
// is a defensive safety net.
export function mapLanesToTeamAvailability(lanes) {
  if (!Array.isArray(lanes)) return [];
  return lanes
    .filter((lane) => lane?.resource?.is_active !== false)
    .map(mapLaneToAvailability)
    .filter((m) => m.resourceId);
}

export function formatTotalHours(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return null;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
