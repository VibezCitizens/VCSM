export function markerForUser(userId, suffix) {
  return `__diag__${String(userId).replace(/-/g, "").slice(0, 10)}__${suffix}`;
}
