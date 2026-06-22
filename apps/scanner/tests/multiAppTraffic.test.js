import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createScannerConfig } from "../src/core/config.js";
import { collectSourceFiles } from "../src/core/fs.js";
import { loadAliases } from "../src/core/aliases.js";
import { createSourceRecords } from "../src/core/sourceRecords.js";
import { scanDependencies } from "../src/scanners/dependencyScanner.js";
import { scanEdgeFunctions } from "../src/scanners/edgeFunctionScanner.js";
import { scanFeatures } from "../src/scanners/featureScanner.js";
import { scanRoutes } from "../src/scanners/routeScanner.js";
import { scanRpcs } from "../src/scanners/rpcScanner.js";
import { scanTests } from "../src/scanners/testScanner.js";
import { scanTrafficApp } from "../src/scanners/trafficAppScanner.js";
import { scanWriteSurfaces } from "../src/scanners/writeSurfaceScanner.js";

test("multi-app scan keeps Traffic and VCSM entries separated by appId", async () => {
  const repoRoot = path.resolve("tests/fixtures/multi-app");
  const config = createScannerConfig({
    scannerRoot: process.cwd(),
    repoRoot,
    scanRoots: ["apps/VCSM/src", "apps/Traffic/src"]
  });
  config.aliases = await loadAliases(config);

  const sourceFiles = await collectSourceFiles(config);
  const records = await createSourceRecords(config, sourceFiles);
  const featureMap = await scanFeatures(config);
  const dependencyMap = await scanDependencies(config, records);
  const routeMap = await scanRoutes(config, records);
  const writeSurfaceMap = await scanWriteSurfaces(config, records);
  const rpcMap = scanRpcs(records);
  const edgeFunctionMap = scanEdgeFunctions(records, writeSurfaceMap);
  const testMap = scanTests(config, records, featureMap);
  const trafficAppMap = await scanTrafficApp(config, records, {
    featureMap,
    routeMap,
    writeSurfaceMap,
    rpcMap,
    edgeFunctionMap,
    testMap,
    dependencyMap,
    engineConsumerMap: { engines: [] }
  });

  assert.ok(featureMap.features.some((entry) => entry.appId === "Traffic" && entry.feature === "home"));
  assert.ok(featureMap.features.some((entry) => entry.appId === "VCSM" && entry.feature === "booking"));
  assert.ok(routeMap.routes.some((entry) => entry.appId === "Traffic" && entry.route === "/"));
  assert.equal(trafficAppMap.app.appId, "Traffic");
  assert.equal(trafficAppMap.app.routeSystem, "next-app-router");
  assert.equal(trafficAppMap.app.edgeFunctions >= 1, true);
});
