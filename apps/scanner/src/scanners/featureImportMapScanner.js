const INTERNAL_LAYER_INDICATORS = ["/dal/", "/controller/", "/controllers/", "/hooks/", "/model/", "/models/"];
const DAL_INDICATORS = ["/dal/", ".dal."];
const UI_PATH_INDICATORS = ["/screens/", "/screen/", "/components/", "/ui/", "/view/"];

// Features that are exempt from RULE-001 (missing adapter surface).
// These are either dev-only, frozen pending migration, or delete candidates.
const ADAPTER_EXEMPT_FEATURES = new Set([
  "debug",     // dev-only panel — no external consumers, no public API
  "hydration", // FROZEN — intentional app-layer bridge, pending ARCH-ENGINESETUP-001
  "reviews",   // DELETE_CANDIDATE — single setup.js stub, no surface to expose
  "vgrid",     // FROZEN (DOCS-ORG-001) — adapters/ dir exists but is empty; exempt until unfrozen
]);

const LAYER_NAMES = new Set([
  "adapters", "adapter", "controller", "controllers", "dal", "hooks", "hook",
  "model", "models", "screens", "screen", "components", "component", "ui",
  "lib", "modules", "module", "config", "state", "style", "styles", "types",
  "utils", "helpers", "services", "queries", "views", "view"
]);

const SPLIT_THRESHOLD = 100;

export function scanFeatureImportMap({ featureMap, dependencyMap }) {
  const vcsmFeatures = featureMap.features.filter(
    (f) => f.appId === "VCSM" && f.kind === "feature"
  );
  const vcsmDeps = dependencyMap.dependencies.filter(
    (d) =>
      d.fromAppId === "VCSM" &&
      d.toAppId === "VCSM" &&
      d.fromKind === "feature" &&
      d.toKind === "feature"
  );

  const edgeSet = new Set(vcsmDeps.map((d) => `${d.fromFeature}→${d.toFeature}`));
  const bidirPairs = detectBidirPairs(vcsmDeps, edgeSet);
  const bidirFeatureMap = buildBidirFeatureMap(bidirPairs);

  const featuresMap = new Map();
  for (const f of vcsmFeatures) {
    const adapterPresent = hasAdapters(f);
    const missingAdapter = !adapterPresent && !ADAPTER_EXEMPT_FEATURES.has(f.feature);
    featuresMap.set(f.feature, {
      name: f.feature,
      path: f.path,
      file_count: f.sourceFileCount,
      layer_counts: f.layerCounts ?? {},
      inbound: [],
      outbound: [],
      violations: [],
      bidir_with: bidirFeatureMap.get(f.feature) ?? [],
      split_candidate: f.sourceFileCount > SPLIT_THRESHOLD,
      split_reason:
        f.sourceFileCount > SPLIT_THRESHOLD
          ? `${f.feature} has ${f.sourceFileCount} files, exceeding 100-file split-readiness threshold.`
          : null,
      adapter_present: adapterPresent,
      missing_adapter: missingAdapter
    });
  }

  let totalViolations = 0;

  for (const dep of vcsmDeps) {
    const toFeaturePath = `${dep.toRoot}/src/features/${dep.toFeature}`;
    const fromNode = featuresMap.get(dep.fromFeature);
    const toNode = featuresMap.get(dep.toFeature);

    for (const imp of dep.imports) {
      const throughAdapter = isAdapterAccess(imp.resolvedPath);
      const rules = detectRules(imp.file, imp.resolvedPath, throughAdapter);
      const violation = rules.length > 0;
      const targetSubfolder = extractTargetSubfolder(imp.resolvedPath, toFeaturePath);

      if (violation) totalViolations++;

      if (fromNode) {
        fromNode.outbound.push({
          to_feature: dep.toFeature,
          from_file: imp.file,
          import_path: imp.importPath,
          resolved_path: imp.resolvedPath,
          target_subfolder: targetSubfolder,
          through_adapter: throughAdapter,
          violation,
          rules
        });
        for (const rule of rules) {
          fromNode.violations.push({
            rule,
            from_feature: dep.fromFeature,
            to_feature: dep.toFeature,
            from_file: imp.file,
            import_path: imp.importPath,
            resolved_path: imp.resolvedPath,
            reason: ruleReason(rule)
          });
        }
      }

      if (toNode) {
        toNode.inbound.push({
          from_feature: dep.fromFeature,
          from_file: imp.file,
          import_path: imp.importPath,
          resolved_path: imp.resolvedPath,
          target_subfolder: targetSubfolder,
          through_adapter: throughAdapter,
          violation,
          rules
        });
      }
    }
  }

  const features = [...featuresMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const missingAdapterCount = features.filter((f) => f.missing_adapter).length;
  const missingAdapterFeatures = features.filter((f) => f.missing_adapter).map((f) => f.name);

  return {
    generated: new Date().toISOString(),
    source: {
      dependencyMap: "apps/scanner/maps/dependency-map.json",
      featureMap: "apps/scanner/maps/feature-map.json"
    },
    feature_count: features.length,
    total_violations: totalViolations,
    missing_adapter_count: missingAdapterCount,
    missing_adapter_features: missingAdapterFeatures,
    bidir_pair_count: bidirPairs.length,
    bidir_pairs: bidirPairs.map((p) => ({ a: p.a, b: p.b })),
    split_candidates: features.filter((f) => f.split_candidate).map((f) => f.name),
    features
  };
}

function hasAdapters(feature) {
  const counts = feature.layerCounts ?? {};
  return (counts.adapters ?? 0) > 0;
}

function isAdapterAccess(resolvedPath) {
  return resolvedPath.includes("/adapters/") || resolvedPath.includes(".adapter");
}

function hasInternalLayer(resolvedPath) {
  return INTERNAL_LAYER_INDICATORS.some((l) => resolvedPath.includes(l));
}

function hasDalAccess(resolvedPath) {
  return DAL_INDICATORS.some((indicator) => resolvedPath.includes(indicator));
}

function isUiFile(filePath) {
  return UI_PATH_INDICATORS.some((p) => filePath.includes(p));
}

function detectRules(fromFile, resolvedPath, throughAdapter) {
  if (throughAdapter) return [];
  const rules = [];
  if (hasInternalLayer(resolvedPath)) {
    rules.push("NO_INTERNAL_WITHOUT_ADAPTER");
  }
  if (hasDalAccess(resolvedPath)) {
    rules.push("NO_CROSS_FEATURE_DAL");
  }
  if (isUiFile(fromFile) && hasDalAccess(resolvedPath)) {
    rules.push("NO_UI_TO_DAL");
  }
  return rules;
}

function ruleReason(rule) {
  switch (rule) {
    case "NO_INTERNAL_WITHOUT_ADAPTER":
      return "Cross-feature import reaches internal layer without adapter boundary.";
    case "NO_CROSS_FEATURE_DAL":
      return "Cross-feature import reaches directly into another feature's DAL layer.";
    case "NO_UI_TO_DAL":
      return "UI file imports directly into another feature's DAL layer.";
    case "MISSING_ADAPTER_SURFACE":
      return "Active feature has no adapters/ directory — external consumers have no public API surface.";
    default:
      return "Unknown rule violation.";
  }
}

function extractTargetSubfolder(resolvedPath, featurePath) {
  const prefix = featurePath + "/";
  if (!resolvedPath.startsWith(prefix)) return null;
  const after = resolvedPath.slice(prefix.length);
  const segments = after.split("/");
  const nonLayerSegments = [];
  for (const seg of segments) {
    const base = seg.split(".")[0].toLowerCase();
    if (LAYER_NAMES.has(base)) break;
    nonLayerSegments.push(seg);
  }
  return nonLayerSegments.length > 0 ? nonLayerSegments.join("/") : null;
}

function detectBidirPairs(vcsmDeps, edgeSet) {
  const seen = new Set();
  const pairs = [];
  for (const dep of vcsmDeps) {
    const reverse = `${dep.toFeature}→${dep.fromFeature}`;
    if (edgeSet.has(reverse)) {
      const pairKey = [dep.fromFeature, dep.toFeature].sort().join("↔");
      if (!seen.has(pairKey)) {
        seen.add(pairKey);
        pairs.push({ key: pairKey, a: dep.fromFeature, b: dep.toFeature });
      }
    }
  }
  return pairs;
}

function buildBidirFeatureMap(pairs) {
  const map = new Map();
  for (const pair of pairs) {
    if (!map.has(pair.a)) map.set(pair.a, []);
    if (!map.has(pair.b)) map.set(pair.b, []);
    map.get(pair.a).push(pair.b);
    map.get(pair.b).push(pair.a);
  }
  return map;
}
