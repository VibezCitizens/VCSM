import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import {
  auditFeature,
  buildFeatureDependencyGraph,
  findFeatureCycles,
  getFeatureCoverageSummary,
  getFeatureHotspots,
} from "@/dev/diagnostics/helpers/featureAudit";
import {
  getFeatureNames,
  getFeatureSourceEntries,
} from "@/dev/diagnostics/helpers/featureSourceIndex";

export const GROUP_ID = "featureCoverage";
export const GROUP_LABEL = "Feature Coverage";

function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: {
      name: "FeatureCoverageViolation",
      message,
    },
  };
}

function trimIssueLists(audit, maxItems = 25) {
  return {
    ...audit,
    issues: {
      missingLayers: audit.issues.missingLayers,
      oversizedFiles: audit.issues.oversizedFiles.slice(0, maxItems),
      depthViolations: audit.issues.depthViolations.slice(0, maxItems),
      relativeImports: audit.issues.relativeImports.slice(0, maxItems),
      crossFeatureImports: audit.issues.crossFeatureImports.slice(0, maxItems),
      namingViolations: audit.issues.namingViolations.slice(0, maxItems),
    },
  };
}

function featureTestName(featureName) {
  return `feature folder audit: ${featureName}`;
}

function featureTestKey(featureName) {
  return `feature_audit_${featureName}`;
}

export function getFeatureCoverageTests() {
  const features = getFeatureNames();

  const base = [
    {
      id: buildTestId(GROUP_ID, "inventory"),
      group: GROUP_ID,
      name: "discover all feature folders and source files",
    },
    {
      id: buildTestId(GROUP_ID, "summary"),
      group: GROUP_ID,
      name: "aggregate architecture coverage summary",
    },
    {
      id: buildTestId(GROUP_ID, "dependency_cycles"),
      group: GROUP_ID,
      name: "detect cross-feature dependency cycles",
    },
    {
      id: buildTestId(GROUP_ID, "hotspots"),
      group: GROUP_ID,
      name: "identify feature code hotspots",
    },
  ];

  const featureRows = features.map((featureName) => ({
    id: buildTestId(GROUP_ID, featureTestKey(featureName)),
    group: GROUP_ID,
    name: featureTestName(featureName),
  }));

  return [...base, ...featureRows];
}

export async function runFeatureCoverageGroup({ onTestUpdate, shared }) {
  const features = getFeatureNames();

  const tests = [
    {
      id: buildTestId(GROUP_ID, "inventory"),
      name: "discover all feature folders and source files",
      run: async () => {
        const entries = getFeatureSourceEntries();
        return {
          featureCount: features.length,
          featureNames: features,
          sourceFileCount: entries.length,
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "summary"),
      name: "aggregate architecture coverage summary",
      run: async () => {
        const summary = getFeatureCoverageSummary();

        if (summary.totalIssues > 0) {
          return failWithData(
            `Detected ${summary.totalIssues} architecture issues across features`,
            {
              featureCount: summary.featureCount,
              featuresWithIssues: summary.featuresWithIssues,
              featuresWithoutIssues: summary.featuresWithoutIssues,
              totalIssues: summary.totalIssues,
              sample: summary.audits
                .filter((row) => row.issueCount > 0)
                .slice(0, 10)
                .map((row) => ({
                  featureName: row.featureName,
                  issueCount: row.issueCount,
                })),
            }
          );
        }

        return summary;
      },
    },
    {
      id: buildTestId(GROUP_ID, "dependency_cycles"),
      name: "detect cross-feature dependency cycles",
      run: async () => {
        const graph = buildFeatureDependencyGraph();
        const cycles = findFeatureCycles(graph);

        if (cycles.length > 0) {
          return failWithData(`Detected ${cycles.length} cross-feature dependency cycles`, {
            cycleCount: cycles.length,
            cycles: cycles.slice(0, 20),
          });
        }

        return {
          cycleCount: 0,
          message: "No cross-feature cycles detected in static imports.",
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "hotspots"),
      name: "identify feature code hotspots",
      run: async () => {
        const hotspots = getFeatureHotspots(30);

        return {
          hotspotCount: hotspots.length,
          hotspots,
          note: "Hotspots are sorted by code lines and import count.",
        };
      },
    },
  ];

  for (const featureName of features) {
    tests.push({
      id: buildTestId(GROUP_ID, featureTestKey(featureName)),
      name: featureTestName(featureName),
      run: async () => {
        const audit = auditFeature(featureName);

        if (audit.issueCount > 0) {
          return failWithData(
            `Feature ${featureName} has ${audit.issueCount} architecture issues`,
            trimIssueLists(audit)
          );
        }

        return trimIssueLists(audit);
      },
    });
  }

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
