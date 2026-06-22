import path from "node:path";

export function scanScreens(config, sourceRecords, { routeMap }) {
  const routesByElement = buildRoutesByElement(routeMap);
  const screens = [];
  const seen = new Set();

  for (const record of sourceRecords) {
    if (!isScreenFile(record)) continue;

    for (const screenDecl of record.screens) {
      const id = `${record.relative}:${screenDecl.name}`;
      if (seen.has(id)) continue;
      seen.add(id);
      screens.push(buildEntry(record, screenDecl.name, screenDecl, routesByElement));
    }

    // Screen file with no named *Screen exports — capture via filename as a low-confidence fallback
    if (record.screens.length === 0) {
      const componentName = baseName(record.relative);
      const id = `${record.relative}:${componentName}`;
      if (seen.has(id)) continue;
      seen.add(id);
      screens.push(buildFallbackEntry(record, componentName, routesByElement));
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    screens: screens.sort((a, b) => a.id.localeCompare(b.id))
  };
}

function buildEntry(record, componentName, screenDecl, routesByElement) {
  const linkedRoutes = routesByElement.get(componentName) ?? [];
  const isRouteEntry = linkedRoutes.length > 0;
  const screenKind = classifyKind(isRouteEntry, screenDecl.hasHooks);
  const evidence = buildEvidence(isRouteEntry, screenDecl);

  return {
    id: `${record.relative}:${componentName}`,
    appId: record.appId,
    feature: record.feature,
    file: record.relative,
    component: componentName,
    screenKind,
    routes: linkedRoutes.map((r) => r.route),
    access: linkedRoutes[0]?.access ?? "unknown",
    layer: record.layer,
    confidence: isRouteEntry ? "HIGH" : "MEDIUM",
    evidence
  };
}

function buildFallbackEntry(record, componentName, routesByElement) {
  const linkedRoutes = routesByElement.get(componentName) ?? [];
  return {
    id: `${record.relative}:${componentName}`,
    appId: record.appId,
    feature: record.feature,
    file: record.relative,
    component: componentName,
    screenKind: "unknown-screen",
    routes: linkedRoutes.map((r) => r.route),
    access: linkedRoutes[0]?.access ?? "unknown",
    layer: record.layer,
    confidence: "LOW",
    evidence: ["screen file discovered from path pattern, no named screen component found"]
  };
}

function classifyKind(isRouteEntry, hasHooks) {
  if (hasHooks) return "view-screen";
  if (isRouteEntry) return "final-screen";
  return "unknown-screen";
}

function buildEvidence(isRouteEntry, screenDecl) {
  const evidence = ["screen component discovered from file path"];
  if (isRouteEntry) evidence.push("linked to route element");
  if (screenDecl.hasHooks && screenDecl.hookNames.length > 0) {
    evidence.push(`hooks: ${screenDecl.hookNames.join(", ")}`);
  }
  return evidence;
}

function buildRoutesByElement(routeMap) {
  const map = new Map();
  for (const route of routeMap.routes) {
    if (!route.elementName) continue;
    if (!map.has(route.elementName)) map.set(route.elementName, []);
    map.get(route.elementName).push(route);
  }
  return map;
}

function isScreenFile(record) {
  return record.layer === "screen" || /Screen\.[jt]sx?$/.test(path.basename(record.relative));
}

function baseName(relativePath) {
  return path.basename(relativePath).replace(/\.[^.]+$/, "");
}
