import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";

export function resolveTypeGroup(type) {
  if (!type) return null;
  const lower = String(type).toLowerCase();
  for (const [group, types] of Object.entries(VPORT_TYPE_GROUPS)) {
    if (types.includes(lower)) return group;
  }
  return "Other";
}

export function safeJson(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function normalizeUrl(url) {
  const raw = (url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export function formatAddress(addr) {
  const a = safeJson(addr);
  const parts = [a.line1, a.line2, a.city, a.state, a.zip, a.country]
    .map((x) => (x ? String(x).trim() : ""))
    .filter(Boolean);
  return parts.join(", ");
}

export const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABEL = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export function formatTimeRange(start, end) {
  const s = (start || "").toString().trim();
  const e = (end || "").toString().trim();
  if (!s && !e) return "";
  if (s && e) return `${s} – ${e}`;
  if (s && !e) return `${s} –`;
  return `– ${e}`;
}

export function dayValueFromWeekly(weekly, dayKey) {
  const intervals = Array.isArray(weekly?.[dayKey]) ? weekly[dayKey] : [];
  if (intervals.length === 0) return "Closed";
  const v = intervals
    .map((it) => formatTimeRange(it?.start, it?.end))
    .filter(Boolean)
    .join(", ");
  return v || "Closed";
}

export function formatWeeklyHoursPerDay(hoursRaw) {
  const h = safeJson(hoursRaw);
  if (!h || typeof h !== "object") return { days: [], timezone: "" };
  const tz = (h.timezone || h.timeZone || "").toString().trim();
  const alwaysOpen = h.always_open === true || h.alwaysOpen === true;
  const weekly = h.weekly && typeof h.weekly === "object" ? h.weekly : null;
  if (alwaysOpen) {
    return {
      timezone: tz,
      days: DAY_ORDER.map((d) => ({ day: d, label: DAY_LABEL[d], value: "Open 24/7" })),
    };
  }
  if (!weekly) return { days: [], timezone: tz };
  const days = DAY_ORDER.map((d) => ({
    day: d,
    label: DAY_LABEL[d],
    value: dayValueFromWeekly(weekly, d),
  }));
  const hasAny = days.some((x) => (x.value || "").trim().length > 0);
  return { days: hasAny ? days : [], timezone: tz };
}

export function normalizeStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}
