import {
  getFeatureNames,
  getFeatureSourceEntries,
} from "@/dev/diagnostics/helpers/featureSourceIndex";
import { countCodeLines } from "@/dev/diagnostics/helpers/codeLineCounter";
import { buildFeatureFileMetrics } from "@/dev/diagnostics/helpers/featureFileMetrics";
import {
  checkFileNaming,
  detectLayer,
  extractImports,
  getRelativeDepth,
  isValidCrossFeatureImport,
  parseFeatureFromSpecifier,
  summarizeTopDirectories,
} from "@/dev/diagnostics/helpers/featureAudit.helpers";

const REQUIRED_LAYERS = ["adapters", "dal", "model", "controller", "hooks", "components", "screens"];

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
