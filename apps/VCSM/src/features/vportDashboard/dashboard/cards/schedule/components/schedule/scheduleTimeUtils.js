import { DAY_START, DAY_END, HOUR_HEIGHT, SNAP_MINUTES, TOTAL_HEIGHT } from "./scheduleConstants";

export function timeToPx(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return ((h - DAY_START) * 60 + m) / 60 * HOUR_HEIGHT;
}

export function clampPx(px) {
  return Math.max(0, Math.min(TOTAL_HEIGHT, px));
}

export function pxToTimeSnapped(px) {
  const totalMin = (clampPx(px) / HOUR_HEIGHT) * 60 + DAY_START * 60;
  const snapped  = Math.round(totalMin / SNAP_MINUTES) * SNAP_MINUTES;
  const h = Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isoToLocalHHMM(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatHour(h) {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function formatHHMM(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12    = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDateHeader(dateKey, isToday) {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const dateStr = date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  return isToday ? `Today · ${weekday} ${dateStr}` : `${weekday}, ${dateStr}`;
}

export function getCurrentTimePx() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < DAY_START || h >= DAY_END) return null;
  return ((h - DAY_START) * 60 + m) / 60 * HOUR_HEIGHT;
}
