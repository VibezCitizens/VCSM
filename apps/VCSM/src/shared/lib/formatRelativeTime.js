// src/shared/lib/formatRelativeTime.js
//
// Shared human-friendly timestamp formatting. Single source of truth so
// components never reimplement relative-time logic.
//
//   formatRelativeTime(value) -> "just now" | "5m ago" | "3h ago" |
//                                "Yesterday" | "2 days ago" | "Jun 13" |
//                                "Jun 13, 2025"  (different year)
//   formatExactTimestamp(value) -> "Jun 13, 2026 • 9:08 PM"  (tooltip / a11y)
//   toISOStringSafe(value)      -> machine-readable ISO for <time dateTime>
//
// All functions are null/NaN safe and return "" (or undefined for ISO) on bad input.

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function shortDate(date, nowDate) {
  const sameYear = nowDate.getFullYear() === date.getFullYear();
  const options = sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" };
  try {
    return date.toLocaleDateString("en-US", options);
  } catch {
    return "";
  }
}

/**
 * Relative timestamp with graceful absolute fallback past 7 days.
 *
 * @param {string|number|Date} value
 * @param {number} [now] — epoch ms, injectable for testing
 * @returns {string}
 */
export function formatRelativeTime(value, now = Date.now()) {
  if (!value) return "";

  const date = new Date(value);
  const ts = date.getTime();
  if (Number.isNaN(ts)) return "";

  const diff = now - ts;

  // Future timestamps (clock skew) and sub-minute -> "just now"
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;

  return shortDate(date, new Date(now));
}

/**
 * Exact, human-readable timestamp for tooltips and screen readers.
 * Example: "Jun 13, 2026 • 9:08 PM"
 *
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatExactTimestamp(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart} • ${timePart}`;
  } catch {
    return "";
  }
}

/**
 * Machine-readable ISO string for the <time dateTime="..."> attribute.
 *
 * @param {string|number|Date} value
 * @returns {string|undefined}
 */
export function toISOStringSafe(value) {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}
