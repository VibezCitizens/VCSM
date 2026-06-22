export function parseReactRoutes(source) {
  const routes = [];
  const routeObjectPattern = /\bpath\s*:\s*["'`]([^"'`]+)["'`]/g;
  const routeElementPattern = /<Route\b[^>]*\bpath=["'`]([^"'`]+)["'`]/g;

  for (const match of source.matchAll(routeObjectPattern)) routes.push(match[1]);
  for (const match of source.matchAll(routeElementPattern)) routes.push(match[1]);

  return [...new Set(routes)];
}

export function classifyRoute(routePath, source, filePath) {
  const isDynamic = /[:*\[]/.test(routePath);
  const lower = `${source}\n${filePath}`.toLowerCase();
  const isProtected = /(protectedroute|requireauth|requirerole|profilegated|authguard|private)/i.test(lower);
  const isNative = /(capacitor|native|ios|android|pwa)/i.test(lower);

  return {
    route: routePath,
    type: isDynamic ? "dynamic" : "static",
    routeType: routePath.includes("*") ? "wildcard" : isDynamic ? "dynamic" : "static",
    access: isProtected ? "protected" : "public",
    routeAccess: isProtected ? "protected" : "public",
    runtime: isNative ? "native-aware" : "web"
  };
}
