export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
  hold: "Hold",
};

export const SEGMENT_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const DURATION_OPTIONS = [30, 45, 60];

export const VISITOR_SLOT_DURATION_MINUTES = 60;

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function fromDateKey(key) {
  const [year, month, day] = String(key || "").split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function shiftMonth(date, offset) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + Number(offset || 0));
  return startOfMonth(next);
}

export function startOfWeek(date) {
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) return startOfMonth(new Date());
  normalized.setHours(0, 0, 0, 0);
  normalized.setDate(normalized.getDate() - normalized.getDay());
  return normalized;
}

export function addDays(date, amount) {
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) return new Date();
  normalized.setDate(normalized.getDate() + Number(amount || 0));
  return normalized;
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatDateLabel(dateKey) {
  const normalized = fromDateKey(dateKey);
  return normalized.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function timeToMinutes(value) {
  const [hours = "0", minutes = "0"] = String(value || "").split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function minutesToTime(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function toLocalTimeHHMM(iso) {
  const normalized = new Date(iso);
  if (Number.isNaN(normalized.getTime())) return "00:00";
  return `${pad2(normalized.getHours())}:${pad2(normalized.getMinutes())}`;
}

export function toLocalDateLabel(iso) {
  const normalized = new Date(iso);
  if (Number.isNaN(normalized.getTime())) return "";
  return normalized.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function groupSlotsBySegment(slots) {
  const grouped = { morning: [], afternoon: [], evening: [] };
  for (const slot of Array.isArray(slots) ? slots : []) {
    const minutes = timeToMinutes(slot);
    if (minutes < 12 * 60) grouped.morning.push(slot);
    else if (minutes < 17 * 60) grouped.afternoon.push(slot);
    else grouped.evening.push(slot);
  }
  return grouped;
}

export function normalizeDurationMinutes(value, fallback = 30) {
  const duration = Math.floor(Number(value));
  if (!Number.isFinite(duration) || duration < 5) return fallback;
  return Math.min(240, duration);
}

export function getNearestDurationOption(value) {
  const normalized = normalizeDurationMinutes(value, DURATION_OPTIONS[0]);
  return DURATION_OPTIONS.reduce((closest, option) =>
    Math.abs(option - normalized) < Math.abs(closest - normalized) ? option : closest
  );
}
