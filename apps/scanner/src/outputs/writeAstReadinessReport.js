import fs from "node:fs/promises";
import path from "node:path";

export async function writeAstReadinessReport(config, maps) {
  const reportPath = path.join(config.scannerRoot, "reports", "scanner-ast-readiness-report.md");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, renderReport(maps), "utf8");
}

function renderReport(maps) {
  const deps = maps["dependency-map.json"].data.dependencies;
  const routes = maps["route-map.json"].data.routes;
  const writes = maps["write-surface-map.json"].data.writeSurfaces;
  const rpcs = maps["rpc-map.json"].data.rpcs;
  const edgeFunctions = maps["edge-function-map.json"].data.edgeFunctions;
  const engines = maps["engine-candidates.json"].data.engineCandidates;

  return `# Scanner AST Readiness Report

Generated: ${new Date().toISOString()}

## Accuracy Upgrade

| Area | Old Scanner | AST Scanner |
|---|---|---|
| Imports | regex/string extraction | Babel AST import/export extraction |
| Routes | regex route literals | JSX Route and route object AST extraction plus Next file routes |
| Writes | chained-call regex | AST call-expression extraction |
| RPCs | embedded in write map | dedicated rpc-map.json |
| Edge functions | embedded in write map | dedicated edge-function-map.json |
| Tests | filename ownership | test declaration extraction plus ownership |

## Discovery Counts

| Output | Count |
|---|---:|
| Dependencies | ${deps.length} |
| Routes | ${routes.length} |
| Writes | ${writes.length} |
| RPCs | ${rpcs.length} |
| Edge functions | ${edgeFunctions.length} |
| Engine candidates | ${engines.length} |

## Consumer Readiness

| Consumer | Readiness | Inputs |
|---|---|---|
| ARCHITECT | READY | feature, dependency, route, write, rpc, edge, graph, test maps |
| VENOM | READY | write, rpc, edge, route maps |
| DR. STRANGE | READY | feature, dependency, graph, engine candidates |
| THOR | READY | all maps with freshness and confidence metadata |

## Remaining Precision Limits

- Scanner does not execute application code or bundler plugins.
- Protected route detection from wrapper structure is still conservative.
- AST extraction confidence is not governance approval.
`;
}
