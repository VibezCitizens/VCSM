export function extractImports(source) {
  if (!source) return [];

  const values = [];
  const pattern = /(?:import\s+[^"']*from\s+|import\s*\()\s*["']([^"']+)["']/g;

  let match = pattern.exec(source);
  while (match) {
    values.push(match[1]);
    match = pattern.exec(source);
  }

  return values;
}

export function parseFeatureFromSpecifier(specifier) {
  if (!specifier?.startsWith("@/features/")) return null;
  const rest = specifier.replace("@/features/", "");
  const featureName = rest.split("/")[0];
  return featureName || null;
}

export function getRelativeDepth(path, featureName) {
  const parts = path.split("/");
  const featureIndex = parts.findIndex((part) => part === featureName);
  if (featureIndex < 0) return 0;

  const relative = parts.slice(featureIndex + 1);
  const dirSegments = relative.slice(0, -1);
  return dirSegments.length;
}

export function detectLayer(path, featureName) {
  const parts = path.split("/");
  const featureIndex = parts.findIndex((part) => part === featureName);
  if (featureIndex < 0) return null;

  const first = parts[featureIndex + 1] ?? null;
  if (!first) return null;

  if (first === "adapter" || first === "adapters") return "adapters";
  if (first === "controller" || first === "controllers") return "controller";
  return first;
}

export function isValidCrossFeatureImport(currentFeature, specifier) {
  if (!specifier.startsWith("@/features/")) return true;

  const rest = specifier.replace("@/features/", "");
  const targetFeature = parseFeatureFromSpecifier(specifier);
  if (!targetFeature || targetFeature === currentFeature) return true;

  if (rest === targetFeature || rest === `${targetFeature}/index` || rest === `${targetFeature}/index.js`) {
    return true;
  }

  return (
    rest.includes(`/${targetFeature}/adapters/`) ||
    rest.includes(`/${targetFeature}/adapter/`) ||
    rest.startsWith(`${targetFeature}/adapters/`) ||
    rest.startsWith(`${targetFeature}/adapter/`)
  );
}

export function checkFileNaming(path, layer) {
  const filename = path.split("/").pop() ?? "";
  const violations = [];

  if (layer === "dal" && !filename.endsWith(".dal.js")) {
    violations.push("DAL file should end with .dal.js");
  }

  if (layer === "model" && !filename.endsWith(".model.js")) {
    violations.push("Model file should end with .model.js");
  }

  if (layer === "controller" && !filename.endsWith(".controller.js")) {
    violations.push("Controller file should end with .controller.js");
  }

  if (layer === "hooks" && filename !== "index.js" && !filename.startsWith("use")) {
    violations.push("Hook file should start with use");
  }

  if (
    layer === "adapters" &&
    filename !== "index.js" &&
    !filename.endsWith(".adapter.js") &&
    !filename.endsWith(".adapters.js")
  ) {
    violations.push("Adapter file should end with .adapter.js");
  }

  if (
    layer === "screens" &&
    !filename.endsWith("Screen.jsx") &&
    !filename.endsWith(".screen.jsx") &&
    !filename.endsWith(".view.jsx")
  ) {
    violations.push("Screen file should end with Screen.jsx, .screen.jsx, or .view.jsx");
  }

  return violations;
}

export function summarizeTopDirectories(files, featureName) {
  const counts = new Map();

  for (const file of files) {
    const parts = file.path.split("/");
    const featureIndex = parts.findIndex((part) => part === featureName);
    const first = parts[featureIndex + 1] ?? "(root)";
    counts.set(first, (counts.get(first) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, fileCount]) => ({ name, fileCount }))
    .sort((a, b) => b.fileCount - a.fileCount)
    .slice(0, 5);
}
