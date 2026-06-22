export const HOUR_HEIGHT  = 80;
export const DAY_START   = 6;
export const DAY_END     = 22;
export const TOTAL_HOURS = DAY_END - DAY_START;
export const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;
export const SNAP_MINUTES = 15;

export const LANE_COLORS = [
  { primary: "rgba(139,92,246,0.9)",  bg: "rgba(139,92,246,0.10)",  border: "rgba(139,92,246,0.22)", text: "rgba(196,170,250,0.9)",  dot: "#8b5cf6" },
  { primary: "rgba(59,130,246,0.9)",  bg: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.22)", text: "rgba(147,197,253,0.9)",  dot: "#3b82f6" },
  { primary: "rgba(16,185,129,0.9)",  bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.22)", text: "rgba(110,231,183,0.9)",  dot: "#10b981" },
  { primary: "rgba(245,158,11,0.9)",  bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.22)", text: "rgba(252,211,77,0.9)",   dot: "#f59e0b" },
  { primary: "rgba(244,63,94,0.9)",   bg: "rgba(244,63,94,0.10)",   border: "rgba(244,63,94,0.22)",  text: "rgba(253,164,175,0.9)",  dot: "#f43f5e" },
  { primary: "rgba(6,182,212,0.9)",   bg: "rgba(6,182,212,0.10)",   border: "rgba(6,182,212,0.22)",  text: "rgba(103,232,249,0.9)",  dot: "#06b6d4" },
  { primary: "rgba(132,204,22,0.9)",  bg: "rgba(132,204,22,0.10)",  border: "rgba(132,204,22,0.22)", text: "rgba(190,242,100,0.9)",  dot: "#84cc16" },
];

export const STATUS_CONFIG = {
  pending:   { label: "Pending",   dot: "#f59e0b" },
  confirmed: { label: "Confirmed", dot: null },
  completed: { label: "Completed", dot: "#94a3b8" },
  no_show:   { label: "No Show",   dot: "#f87171" },
  cancelled: { label: "Cancelled", dot: "#6b7280" },
};
