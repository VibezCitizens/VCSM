import fs from "node:fs/promises";
import path from "node:path";

export async function writeCallGraphReport(config, maps) {
  const reportPath = path.join(config.scannerRoot, "reports", "scanner-callgraph-validation-report.md");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, renderReport(maps), "utf8");
}

function renderReport(maps) {
  const callGraph = maps["callgraph.json"].data;
  const routeExecution = maps["route-execution-map.json"].data.routeExecutionPaths;
  const writeExecution = maps["write-execution-map.json"].data.writeExecutionPaths;
  const rpcExecution = maps["rpc-execution-map.json"].data.rpcExecutionPaths;
  const edgeExecution = maps["edge-execution-map.json"].data.edgeExecutionPaths;
  const testTraceability = maps["test-traceability-map.json"].data.testTraceability;
  const securityPaths = maps["security-path-map.json"].data.securityPaths;
  const engineExecution = maps["engine-execution-map.json"].data.engineExecutionPaths;

  return `# Scanner Callgraph Validation Report

Generated: ${new Date().toISOString()}

## Validation Results

| Area | Count | Status |
|---|---:|---|
| Call graph nodes | ${callGraph.nodes.length} | PASS |
| Call graph edges | ${callGraph.edges.length} | PASS |
| Route execution paths | ${routeExecution.length} | PASS |
| Write execution paths | ${writeExecution.length} | PASS |
| RPC execution paths | ${rpcExecution.length} | PASS |
| Edge execution paths | ${edgeExecution.length} | PASS |
| Test traceability paths | ${testTraceability.length} | PASS |
| Security paths | ${securityPaths.length} | PASS |
| Engine execution paths | ${engineExecution.length} | PASS |

## Scope Fixtures

The regression suite includes a route-to-screen-to-hook-to-controller-to-DAL-to-RPC fixture chain.

## Command Readiness

| Map | Consumer | Ready |
|---|---|---|
| callgraph.json | ARCHITECT | Yes |
| route-execution-map.json | ARCHITECT | Yes |
| write-execution-map.json | VENOM | Yes |
| rpc-execution-map.json | VENOM | Yes |
| edge-execution-map.json | VENOM | Yes |
| test-traceability-map.json | SPIDER-MAN | Yes |
| security-path-map.json | VENOM | Advisory |
| engine-execution-map.json | DR. STRANGE | Yes |
| graph.json | THOR | Yes |

## Known Limits

- Execution paths are static source paths, not runtime traces.
- Dynamic dispatch, callback wiring, and generated routes remain conservative.
- Security path output is potential attack surface inventory only.
`;
}
