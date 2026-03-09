const featureSourceModules = import.meta.glob("/src/features/**/*.{js,jsx}", {
  eager: true,
  query: "?raw",
  import: "default",
});

function normalizePath(path) {
  if (!path) return "";
  return path.startsWith("/") ? path.slice(1) : path;
}

function toFeatureName(path) {
  const normalized = normalizePath(path);
  const match = normalized.match(/^src\/features\/([^/]+)\//);
  return match?.[1] ?? null;
}

let cachedEntries = null;

function buildEntries() {
  const rows = [];

  for (const [rawPath, source] of Object.entries(featureSourceModules)) {
    const path = normalizePath(rawPath);
    const featureName = toFeatureName(path);
    if (!featureName) continue;

    rows.push({
      path,
      featureName,
      source: typeof source === "string" ? source : "",
    });
  }

  rows.sort((a, b) => a.path.localeCompare(b.path));
  return rows;
}

export function getFeatureSourceEntries() {
  if (!cachedEntries) {
    cachedEntries = buildEntries();
  }
  return cachedEntries;
}

export function getFeatureNames() {
  const names = new Set(getFeatureSourceEntries().map((entry) => entry.featureName));
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}
