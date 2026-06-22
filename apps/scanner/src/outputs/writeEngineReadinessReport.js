import fs from "node:fs/promises";
import path from "node:path";

export async function writeEngineReadinessReport(config, maps, validation = null) {
  const reportPath = path.join(config.scannerRoot, "reports", "engine-readiness-report.md");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, renderReport(maps, validation), "utf8");
}

function renderReport(maps, validation) {
  const engineMap = maps["engine-map.json"].data.engines;
  const consumers = new Map(maps["engine-consumer-map.json"].data.engines.map((entry) => [entry.engine, entry]));
  const security = new Map(maps["engine-security-map.json"].data.engines.map((entry) => [entry.engine, entry]));
  const ownership = new Map(maps["engine-ownership-map.json"].data.engines.map((entry) => [entry.engine, entry]));
  const entrypoints = new Map(maps["engine-entrypoint-map.json"].data.engines.map((entry) => [entry.engine, entry]));

  const readiness = new Map((validation?.readinessResults ?? []).map((entry) => [entry.engine, entry]));

  return `# Engine Readiness Report

Generated: ${new Date().toISOString()}

| Engine | Completeness | Score | Consumers | Security Risk | Tests | Exports | Ownership |
|---|---|---:|---:|---|---:|---:|---|
${engineMap.map((engine) => {
  const consumer = consumers.get(engine.engine);
  const securityEntry = security.get(engine.engine);
  const ownershipEntry = ownership.get(engine.engine);
  const entrypoint = entrypoints.get(engine.engine);
  const score = readiness.get(engine.engine)?.score ?? "n/a";
  return `| ${engine.engine} | ${completeness(engine, ownershipEntry, entrypoint)} | ${score} | ${consumer?.consumers.length ?? 0} | ${securityEntry?.riskTier ?? "LOW"} | ${engine.tests} | ${entrypoint?.entrypoints.length ?? 0} | ${ownershipEntry?.hasClaude ? "PRESENT" : "MISSING"} |`;
}).join("\n")}

## Consumer Readiness

| Consumer | Maps |
|---|---|
| ARCHITECT | engine-map, engine-graph, engine-consumer-map |
| VENOM | engine-security-map, engine-execution-map |
| BLACKWIDOW | engine-execution-map, engine-security-map |
| ELEKTRA | engine-security-map, engine-entrypoint-map |
| DR. STRANGE | engine-readiness-report |
| PROFESSOR X | future behavior-to-engine mapping |
`;
}

function completeness(engine, ownership, entrypoint) {
  if (engine.controllers && engine.dals && engine.tests && ownership?.hasClaude && entrypoint?.entrypoints.length) return "HIGH";
  if ((engine.controllers || engine.dals) && entrypoint?.entrypoints.length) return "MEDIUM";
  return "LOW";
}
