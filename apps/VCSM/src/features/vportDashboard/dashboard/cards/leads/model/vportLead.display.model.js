import { toText } from "@/shared/lib/text";

/**
 * Display-layer transforms for vport lead data.
 * Pure functions — no side effects, no DB access.
 *
 * Moved from: screens/vportDashboardLeadsScreen.model.js
 */

export function formatLeadDate(value) {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatSourceLabel(source) {
  const normalized = toText(source).toLowerCase();
  if (!normalized) return "unknown";

  const cleaned = normalized
    .replace(/_contacted$/g, "")
    .replace(/:contacted$/g, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ");

  return cleaned || "unknown";
}

export function previewMessage(message) {
  const text = toText(message);
  if (!text) return "No message provided.";
  if (text.length <= 220) return text;
  return `${text.slice(0, 217)}...`;
}
