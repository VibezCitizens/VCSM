import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createScannerConfig } from "../src/core/config.js";
import { createSourceRecords } from "../src/core/sourceRecords.js";
import { scanDependencies } from "../src/scanners/dependencyScanner.js";
import { scanEdgeFunctions } from "../src/scanners/edgeFunctionScanner.js";
import { scanEngineDiscovery } from "../src/scanners/engineDiscoveryScanner.js";
import { scanRpcs } from "../src/scanners/rpcScanner.js";
import { scanWriteSurfaces } from "../src/scanners/writeSurfaceScanner.js";

test("engine discovery inventories roots, ownership, entrypoints, and security surfaces", async () => {
  const repoRoot = path.resolve("tests/fixtures/engine-discovery");
  const config = createScannerConfig({
    scannerRoot: process.cwd(),
    repoRoot,
    scanRoots: ["engines"]
  });
  config.aliases = new Map();

  const sourceFiles = [
    "engines/sample/index.js",
    "engines/sample/src/adapters/index.js",
    "engines/sample/src/controller/sample.controller.js",
    "engines/sample/src/dal/sample.write.dal.js"
  ].map((file) => path.join(repoRoot, file));

  const records = await createSourceRecords(config, sourceFiles);
  const dependencyMap = await scanDependencies(config, records);
  const writeSurfaceMap = await scanWriteSurfaces(config, records);
  const rpcMap = scanRpcs(records);
  const edgeFunctionMap = scanEdgeFunctions(records, writeSurfaceMap);
  const result = await scanEngineDiscovery(config, records, {
    dependencyMap,
    writeSurfaceMap,
    rpcMap,
    edgeFunctionMap,
    callGraphMaps: { engineExecutionMap: { engineExecutionPaths: [] }, callGraph: { edges: [] } }
  });

  const sample = result.engineMap.engines.find((entry) => entry.engine === "sample");
  assert.equal(sample.hasClaude, true);
  assert.equal(sample.controllers, 1);
  assert.equal(sample.dals, 1);
  assert.equal(sample.rpcs, 1);

  const entrypoints = result.engineEntrypointMap.engines.find((entry) => entry.engine === "sample");
  assert.equal(entrypoints.entrypoints.includes("sampleEntrypoint"), true);

  const ownership = result.engineOwnershipMap.engines.find((entry) => entry.engine === "sample");
  assert.equal(ownership.boundaryRules.some((rule) => rule.includes("No app-specific imports")), true);

  const security = result.engineSecurityMap.engines.find((entry) => entry.engine === "sample");
  assert.equal(security.writes, 1);
  assert.equal(security.rpcs, 1);
});
