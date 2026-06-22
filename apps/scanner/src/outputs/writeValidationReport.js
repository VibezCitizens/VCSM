import fs from "node:fs/promises";
import path from "node:path";
import { confidenceDistribution } from "../validation/validateMaps.js";

export async function writeValidationReport(config, maps, validationResults) {
  const reportPath = path.join(config.scannerRoot, "reports", "scanner-validation-report.md");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, renderReport(maps, validationResults), "utf8");
}

function renderReport(maps, validationResults) {
  const dependencies = maps["dependency-map.json"].data.dependencies;
  const routes = maps["route-map.json"].data.routes;
  const writes = maps["write-surface-map.json"].data.writeSurfaces;
  const rpcs = maps["rpc-map.json"].data.rpcs;
  const edgeFunctions = maps["edge-function-map.json"].data.edgeFunctions;
  const engines = maps["engine-candidates.json"].data.engineCandidates;

  return `# Scanner Validation Report

Generated: ${new Date().toISOString()}

## Schema Validation Results

| Scope | Status | Errors |
|---|---|---|
${validationResults.map((result) => `| ${result.scope} | ${result.status} | ${result.errors.join("; ") || "None"} |`).join("\n")}

## Route Validation Results

- Routes indexed: ${routes.length}
- Route nodes retain \`RouteNode\`: ${maps["graph.json"].data.nodes.filter((node) => node.id.startsWith("route:") && node.type === "RouteNode").length}
- Confidence: ${formatDistribution(confidenceDistribution(routes))}

## Dependency Validation Results

- Dependencies indexed: ${dependencies.length}
- Confidence: ${formatDistribution(confidenceDistribution(dependencies))}

## Engine Validation Results

- Engine candidates indexed: ${engines.length}
- Engine folders included: ${engines.filter((engine) => engine.evidence?.includes("engine folder exists")).map((engine) => engine.engine).sort().join(", ")}
- Confidence: ${formatDistribution(confidenceDistribution(engines))}

## Confidence Distribution

| Map | Distribution |
|---|---|
| route-map.json | ${formatDistribution(confidenceDistribution(routes))} |
| dependency-map.json | ${formatDistribution(confidenceDistribution(dependencies))} |
| write-surface-map.json | ${formatDistribution(confidenceDistribution(writes))} |
| rpc-map.json | ${formatDistribution(confidenceDistribution(rpcs))} |
| edge-function-map.json | ${formatDistribution(confidenceDistribution(edgeFunctions))} |
| engine-candidates.json | ${formatDistribution(confidenceDistribution(engines))} |

## ARCHITECT Readiness

| Map | Ready For ARCHITECT | Confidence |
|---|---|---|
| feature-map.json | Yes | ${maps["feature-map.json"].confidence} |
| dependency-map.json | Yes | ${maps["dependency-map.json"].confidence} |
| route-map.json | Yes | ${maps["route-map.json"].confidence} |
| write-surface-map.json | Yes | ${maps["write-surface-map.json"].confidence} |
| rpc-map.json | Yes | ${maps["rpc-map.json"].confidence} |
| edge-function-map.json | Yes | ${maps["edge-function-map.json"].confidence} |
| test-map.json | Yes | ${maps["test-map.json"].confidence} |
| graph.json | Yes | ${maps["graph.json"].confidence} |
| engine-candidates.json | Advisory | ${maps["engine-candidates.json"].confidence} |

## Known Limitations

- Scanner confidence is source-discovery confidence, not architecture approval.
- Route protection is inferred from guard/source naming and should be verified by ARCHITECT before risk claims.
- Import resolution supports project aliases and common engine aliases, but does not fully execute bundler config.
- Engine candidates are advisory domain groupings and require ARCHITECT or DR. STRANGE review before extraction decisions.
`;
}

function formatDistribution(distribution) {
  return Object.entries(distribution).map(([key, value]) => `${key}: ${value}`).join(", ") || "None";
}
