export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — UI guard (engine also enforces)

export function cx(...xs) {
  return xs.filter(Boolean).join(' ');
}

export function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const value of a.values()) {
    if (!b.has(value)) return false;
  }
  return true;
}

export function groupServicesByCategory(services) {
  const groups = new Map();
  for (const service of services ?? []) {
    const category = (service?.category ?? 'Other').toString().trim() || 'Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(service);
  }
  return [...groups.entries()];
}
