export const SNAP       = 30;
export const CELL_H     = 18;
export const TIME_COL_W = 50;
export const STANDARD_S = 5 * 60;
export const STANDARD_E = 24 * 60;
export const FULLDAY_S  = 0;
export const FULLDAY_E  = 24 * 60;
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS   = [1, 2, 3, 4, 5];
export const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function gridOf(mode) {
  const s = mode === "full" ? FULLDAY_S : STANDARD_S;
  const e = mode === "full" ? FULLDAY_E : STANDARD_E;
  const slots = (e - s) / SNAP;
  return { s, e, slots, h: slots * CELL_H };
}

export function pad2(n) { return String(n).padStart(2, "0"); }
export function minsToTime(m) { return `${pad2(Math.floor(m / 60) % 24)}:${pad2(m % 60)}`; }
export function timeToMins(t) {
  const [h = "0", m = "0"] = String(t || "").split(":");
  return Number(h) * 60 + Number(m);
}
export function minsToY(mins, gs)          { return ((mins - gs) / SNAP) * CELL_H; }
export function yToMins(y, gs, slots) {
  return gs + Math.max(0, Math.min(slots - 1, Math.round(y / CELL_H))) * SNAP;
}
export function getWeekStart(d) {
  const d2 = new Date(d); d2.setHours(0, 0, 0, 0);
  d2.setDate(d2.getDate() - d2.getDay()); return d2;
}
export function addDays(d, n) { const d2 = new Date(d); d2.setDate(d2.getDate() + n); return d2; }

export function fmtHour(mins) {
  const h = Math.floor(mins / 60) % 24;
  if (h === 0)  return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}
export function fmtHM(mins) {
  const h = Math.floor(mins / 60) % 24, m = mins % 60;
  if (h === 0 && m === 0)   return "12 AM";
  if (h === 12 && m === 0)  return "12 PM";
  const p = h < 12 ? "AM" : "PM", h12 = h % 12 || 12;
  return m ? `${h12}:${pad2(m)} ${p}` : `${h12} ${p}`;
}
export function fmtRange(s, e) { return `${fmtHM(s)}–${fmtHM(e)}`; }
export function overlaps(s1, e1, s2, e2) { return s1 < e2 && e1 > s2; }
export function uid() { return `b${Date.now()}${Math.random().toString(36).slice(2, 6)}`; }

export function rulesToBlocks(rules) {
  return (Array.isArray(rules) ? rules : [])
    .filter(r => r.isActive !== false && String(r.ruleType ?? "weekly").toLowerCase() === "weekly")
    .map(r => ({ id: r.id, weekday: Number(r.weekday), startMinutes: timeToMins(r.startTime), endMinutes: timeToMins(r.endTime) }))
    .filter(b => b.startMinutes < b.endMinutes);
}
export function detectMode(rules) {
  const bs = rulesToBlocks(rules);
  return bs.some(b => b.startMinutes < STANDARD_S || b.endMinutes > STANDARD_E) ? "full" : "standard";
}
export function dayHoursSummary(dbs) {
  if (!dbs.length) return null;
  const mins = dbs.reduce((s, b) => s + (b.endMinutes - b.startMinutes), 0);
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const tBtn = (extra = {}) => ({
  borderRadius: 7,
  border: "1px solid rgba(148,163,184,.22)",
  background: "rgba(15,23,42,.7)",
  color: "rgba(203,213,225,.9)",
  fontSize: 11, fontWeight: 600,
  padding: "5px 9px", cursor: "pointer",
  whiteSpace: "nowrap",
  ...extra,
});
