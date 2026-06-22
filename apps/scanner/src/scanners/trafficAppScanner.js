import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, toPosix } from "../core/fs.js";

export async function scanTrafficApp(config, sourceRecords, maps) {
  const appId = "Traffic";
  const appRoot = "apps/Traffic";
  const absoluteRoot = path.join(config.repoRoot, appRoot);
  const sourceRoot = `${appRoot}/src`;
  const records = sourceRecords.filter((record) => record.appId === appId);
  const packagePath = path.join(absoluteRoot, "package.json");
  const packageJson = await readJson(packagePath);
  const aliases = await readAliases(config, appRoot);
  const features = maps.featureMap.features.filter((entry) => entry.appId === appId && entry.kind === "feature");
  const routes = maps.routeMap.routes.filter((entry) => entry.appId === appId);
  const writes = maps.writeSurfaceMap.writeSurfaces.filter((entry) => entry.appId === appId);
  const rpcs = maps.rpcMap.rpcs.filter((entry) => entry.appId === appId);
  const edgeFunctions = maps.edgeFunctionMap.edgeFunctions.filter((entry) => entry.appId === appId);
  const tests = maps.testMap.tests.filter((entry) => entry.appId === appId);
  const dependencies = maps.dependencyMap.dependencies.filter((entry) => entry.fromAppId === appId || entry.toAppId === appId);
  const unresolvedAliases = dependencies.flatMap((dependency) => dependency.imports.filter((item) => !item.resolved).map((item) => item.importPath));
  const engineUsage = maps.engineConsumerMap.engines
    .filter((entry) => entry.consumers.some((consumer) => consumer.startsWith(`${appId}:`)))
    .map((entry) => ({ engine: entry.engine, consumers: entry.consumers.filter((consumer) => consumer.startsWith(`${appId}:`)) }));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    app: {
      appId,
      root: appRoot,
      packageJson: await pathExists(packagePath),
      packageName: packageJson?.name ?? null,
      sourceRoot,
      sourceFileCount: records.length,
      routeSystem: detectRouteSystem(records),
      aliases,
      features: features.length,
      components: countLayer(records, "component"),
      hooks: countLayer(records, "hook"),
      controllers: countLayer(records, "controller"),
      dals: countLayer(records, "dal"),
      models: countLayer(records, "model"),
      adapters: countLayer(records, "adapter"),
      tests: tests.length,
      routes: routes.length,
      writes: writes.length,
      rpcs: rpcs.length,
      edgeFunctions: edgeFunctions.length,
      dependencies: dependencies.length,
      engineUsage,
      unresolvedAliases: [...new Set(unresolvedAliases)].sort(),
      confidence: "HIGH",
      evidence: ["Traffic source root scanned directly"]
    }
  };
}

function detectRouteSystem(records) {
  if (records.some((record) => record.relative.includes("apps/Traffic/src/app/"))) return "next-app-router";
  if (records.some((record) => record.routes.length > 0)) return "react-router";
  return "unknown";
}

function countLayer(records, layer) {
  return records.filter((record) => record.layer === layer).length;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function readAliases(config, appRoot) {
  const jsconfig = await readJson(path.join(config.repoRoot, appRoot, "jsconfig.json"));
  const tsconfig = await readJson(path.join(config.repoRoot, appRoot, "tsconfig.json"));
  return {
    jsconfig: normalizePaths(jsconfig?.compilerOptions?.paths),
    tsconfig: normalizePaths(tsconfig?.compilerOptions?.paths),
    scanner: (config.aliases.get(appRoot) ?? []).map((entry) => ({
      find: entry.find,
      replacement: toPosix(entry.replacement)
    }))
  };
}

function normalizePaths(paths) {
  if (!paths) return {};
  return Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, value]));
}
