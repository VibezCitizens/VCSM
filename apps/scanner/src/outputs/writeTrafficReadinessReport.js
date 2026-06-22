import fs from "node:fs/promises";
import path from "node:path";

export async function writeTrafficReadinessReport(config, maps) {
  const reportPath = path.join(config.scannerRoot, "reports", "traffic-scanner-readiness-report.md");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, renderReport(maps), "utf8");
}

function renderReport(maps) {
  const traffic = maps["traffic-app-map.json"].data.app;
  const trafficFeatures = maps["feature-map.json"].data.features.filter((entry) => entry.appId === "Traffic" && entry.kind === "feature");
  const routes = maps["route-map.json"].data.routes.filter((entry) => entry.appId === "Traffic");
  const writes = maps["write-surface-map.json"].data.writeSurfaces.filter((entry) => entry.appId === "Traffic");
  const rpcs = maps["rpc-map.json"].data.rpcs.filter((entry) => entry.appId === "Traffic");
  const edgeFunctions = maps["edge-function-map.json"].data.edgeFunctions.filter((entry) => entry.appId === "Traffic");
  const tests = maps["test-map.json"].data.tests.filter((entry) => entry.appId === "Traffic");

  return `# Traffic Scanner Readiness Report

Generated: ${new Date().toISOString()}

| Area | Count |
|---|---:|
| Features | ${trafficFeatures.length} |
| Routes | ${routes.length} |
| Writes | ${writes.length} |
| RPCs | ${rpcs.length} |
| Edge functions | ${edgeFunctions.length} |
| Tests | ${tests.length} |
| Dependencies | ${traffic.dependencies} |
| Source files | ${traffic.sourceFileCount} |

## Inventory

- App root: \`${traffic.root}\`
- Package: \`${traffic.packageName ?? "unknown"}\`
- Source root: \`${traffic.sourceRoot}\`
- Route system: \`${traffic.routeSystem}\`
- Confidence: \`${traffic.confidence}\`

## Features

${trafficFeatures.map((feature) => `- ${feature.feature}: ${feature.sourceFileCount ?? 0} source files, ${feature.tests ?? 0} tests`).join("\n") || "- None"}

## Engine Usage

${traffic.engineUsage.map((entry) => `- ${entry.engine}: ${entry.consumers.join(", ")}`).join("\n") || "- No engine consumers detected"}

## Unresolved Aliases

${traffic.unresolvedAliases.map((alias) => `- ${alias}`).join("\n") || "- None"}

## Limitations

- Traffic is scanned read-only.
- Static callgraph paths do not execute Next.js runtime behavior.
- Route protection and dynamic data paths still require command-level validation.
`;
}
