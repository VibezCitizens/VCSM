export function toServiceKey(value) {
  return (value ?? "").toString().trim();
}

export function buildEnabledMap(services) {
  const map = new Map();
  (services ?? []).forEach((service) => {
    const key = toServiceKey(service?.key ?? service?.serviceKey ?? service?.id);
    if (!key) return;
    const enabled =
      typeof service?.enabled === "boolean"
        ? service.enabled
        : typeof service?.is_enabled === "boolean"
        ? service.is_enabled
        : service?.enabled !== false;
    map.set(key, Boolean(enabled));
  });
  return map;
}

export function applyEnabledMapToServices(services, enabledMap) {
  return (services ?? []).map((service) => {
    const key = toServiceKey(service?.key ?? service?.serviceKey ?? service?.id);
    if (!key) return service;
    const nextEnabled = enabledMap.has(key) ? enabledMap.get(key) : service?.enabled;
    return {
      ...service,
      key: service?.key ?? key,
      enabled: Boolean(nextEnabled),
    };
  });
}

export function mapsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const [key, value] of a.entries()) {
    if (!b.has(key) || b.get(key) !== value) return false;
  }
  return true;
}

