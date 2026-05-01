export function formatRunTime(timestamp) {
  if (!timestamp) return "Never";
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return String(timestamp);
  }
}

export function toSafeDateStamp(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toISOString().replace(/[:.]/g, "-");
}
