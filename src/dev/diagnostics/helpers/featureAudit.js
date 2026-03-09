import {
  getFeatureNames,
  getFeatureSourceEntries,
} from "@/dev/diagnostics/helpers/featureSourceIndex";
import { countCodeLines } from "@/dev/diagnostics/helpers/codeLineCounter";
import { buildFeatureFileMetrics } from "@/dev/diagnostics/helpers/featureFileMetrics";

const REQUIRED_LAYERS = ["adapters", "dal", "model", "controller", "hooks", "components", "screens"];

function extractImports(source) {
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

function parseFeatureFromSpecifier(specifier) {
  if (!specifier?.startsWith("@/features/")) return null;
  const rest = specifier.replace("@/features/", "");
  const featureName = rest.split("/")[0];
  return featureName || null;
}

function getRelativeDepth(path, featureName) {
  const parts = path.split("/");
  const featureIndex = parts.findIndex((part) => part === featureName);
  if (featureIndex < 0) return 0;

  const relative = parts.slice(featureIndex + 1);
  const dirSegments = relative.slice(0, -1);
  return dirSegments.length;
}

function detectLayer(path, featureName) {
  const parts = path.split("/");
  const featureIndex = parts.findIndex((part) => part === featureName);
  if (featureIndex < 0) return null;

  const first = parts[featureIndex + 1] ?? null;
  if (!first) return null;

  if (first === "adapter" || first === "adapters") return "adapters";
  if (first === "controller" || first === "controllers") return "controller";
  return first;
}

function isValidCrossFeatureImport(currentFeature, specifier) {
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

function checkFileNaming(path, layer) {
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

function summarizeTopDirectories(files, featureName) {
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

export function auditFeature(featureName) {
  const entries = getFeatureSourceEntries().filter((entry) => entry.featureName === featureName);
  const fileMetrics = buildFeatureFileMetrics(entries, featureName);
  const fileLineMap = new Map(fileMetrics.files.map((file) => [file.path, file.codeLines]));

  const missingLayers = [];
  const oversizedFiles = [];
  const depthViolations = [];
  const relativeImports = [];
  const crossFeatureImports = [];
  const namingViolations = [];

  const presentLayers = new Set();
  let totalCodeLines = 0;

  for (const entry of entries) {
    const codeLines = fileLineMap.get(entry.path) ?? countCodeLines(entry.source);
    totalCodeLines += codeLines;

    const layer = detectLayer(entry.path, featureName);
    if (layer) presentLayers.add(layer);

    if (codeLines > 300) {
      oversizedFiles.push({ path: entry.path, codeLines });
    }

    const depth = getRelativeDepth(entry.path, featureName);
    if (depth > 3) {
      depthViolations.push({ path: entry.path, depth });
    }

    for (const specifier of extractImports(entry.source)) {
      if (specifier.startsWith(".")) {
        relativeImports.push({ path: entry.path, specifier });
      }

      if (!isValidCrossFeatureImport(featureName, specifier)) {
        crossFeatureImports.push({ path: entry.path, specifier });
      }
    }

    for (const message of checkFileNaming(entry.path, layer)) {
      namingViolations.push({ path: entry.path, message });
    }
  }

  for (const requiredLayer of REQUIRED_LAYERS) {
    if (!presentLayers.has(requiredLayer)) {
      missingLayers.push(requiredLayer);
    }
  }

  const issueCount =
    missingLayers.length +
    oversizedFiles.length +
    depthViolations.length +
    relativeImports.length +
    crossFeatureImports.length +
    namingViolations.length;

  return {
    featureName,
    fileCount: entries.length,
    totalCodeLines,
    fileMetrics,
    topDirectories: summarizeTopDirectories(entries, featureName),
    issueCount,
    issues: {
      missingLayers,
      oversizedFiles,
      depthViolations,
      relativeImports,
      crossFeatureImports,
      namingViolations,
    },
  };
}

export function getAllFeatureAudits() {
  return getFeatureNames().map((featureName) => auditFeature(featureName));
}

export function getFeatureCoverageSummary() {
  const audits = getAllFeatureAudits();

  const featuresWithIssues = audits.filter((audit) => audit.issueCount > 0);
  const totalIssues = audits.reduce((sum, audit) => sum + audit.issueCount, 0);

  return {
    featureCount: audits.length,
    featuresWithIssues: featuresWithIssues.length,
    featuresWithoutIssues: audits.length - featuresWithIssues.length,
    totalIssues,
    audits,
  };
}

export function buildFeatureDependencyGraph() {
  const graph = new Map();
  const entries = getFeatureSourceEntries();

  for (const entry of entries) {
    if (!graph.has(entry.featureName)) {
      graph.set(entry.featureName, new Set());
    }

    for (const specifier of extractImports(entry.source)) {
      const targetFeature = parseFeatureFromSpecifier(specifier);
      if (!targetFeature || targetFeature === entry.featureName) continue;
      graph.get(entry.featureName).add(targetFeature);
    }
  }

  return graph;
}

export function findFeatureCycles(graph) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();

  function dfs(node, trail) {
    if (visiting.has(node)) {
      const cycleStart = trail.indexOf(node);
      if (cycleStart >= 0) {
        cycles.push([...trail.slice(cycleStart), node]);
      }
      return;
    }

    if (visited.has(node)) return;

    visiting.add(node);
    const nextTrail = [...trail, node];
    const neighbors = graph.get(node) ?? new Set();

    for (const neighbor of neighbors) {
      dfs(neighbor, nextTrail);
    }

    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) {
    dfs(node, []);
  }

  const unique = new Set();
  const deduped = [];

  for (const cycle of cycles) {
    const signature = [...cycle].sort().join("->");
    if (unique.has(signature)) continue;
    unique.add(signature);
    deduped.push(cycle);
  }

  return deduped;
}

export function getFeatureHotspots(limit = 25) {
  const entries = getFeatureSourceEntries();
  const rows = entries.map((entry) => ({
    path: entry.path,
    featureName: entry.featureName,
    codeLines: countCodeLines(entry.source),
    importCount: extractImports(entry.source).length,
  }));

  return rows
    .sort((a, b) => {
      if (b.codeLines !== a.codeLines) return b.codeLines - a.codeLines;
      return b.importCount - a.importCount;
    })
    .slice(0, limit);
}
