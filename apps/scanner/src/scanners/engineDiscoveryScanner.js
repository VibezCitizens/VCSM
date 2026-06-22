import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, readText, toPosix } from "../core/fs.js";
import { classifyPath, layerFromPath } from "../core/ownership.js";

export async function scanEngineDiscovery(config, sourceRecords, maps) {
  const engineRoots = await listEngineRoots(config);
  const engineMap = [];
  const engineEntrypoints = [];
  const engineOwnership = [];
  const engineSecurity = [];
  const engineGraph = { nodes: [], edges: [] };
  const engineConsumers = [];

  for (const engine of engineRoots) {
    const engineRecords = sourceRecords.filter((record) => record.relative.startsWith(`${engine.path}/`));
    const claudePath = path.join(config.repoRoot, engine.path, "CLAUDE.md");
    const hasClaude = await pathExists(claudePath);
    const claudeText = hasClaude ? await readText(claudePath) : "";
    const ownership = parseOwnership(claudeText);
    const entrypointRecords = engineRecords.filter((record) => isEntrypoint(record.relative, engine.path));
    const entrypoints = discoverEntrypoints(engineRecords, entrypointRecords);
    const controllers = engineRecords.filter((record) => layerFromPath(record.relative) === "controller");
    const dals = engineRecords.filter((record) => layerFromPath(record.relative) === "dal");
    const tests = engineRecords.filter((record) => record.tests.length > 0 || /(^|\/)(__tests__|tests?)\//.test(record.relative));
    const rpcs = maps.rpcMap.rpcs.filter((rpc) => rpc.file.startsWith(`${engine.path}/`));
    const edgeFunctions = maps.edgeFunctionMap.edgeFunctions.filter((edge) => edge.file.startsWith(`${engine.path}/`));
    const writes = maps.writeSurfaceMap.writeSurfaces.filter((write) => {
      return write.file.startsWith(`${engine.path}/`) && ["insert", "update", "delete", "upsert"].includes(write.operation);
    });
    const externalApis = discoverExternalApis(engineRecords);
    const consumers = discoverConsumers(engine.engine, maps.dependencyMap, maps.callGraphMaps?.callGraph);
    const engineDependencies = discoverEngineDependencies(engine.engine, maps.dependencyMap);

    engineMap.push({
      engine: engine.engine,
      path: engine.path,
      hasClaude,
      exports: entrypoints.length,
      entrypoints: entrypoints.length,
      controllers: controllers.length,
      dals: dals.length,
      rpcs: rpcs.length,
      edgeFunctions: edgeFunctions.length,
      tests: tests.length,
      confidence: "HIGH",
      evidence: ["engine root scanned directly"]
    });

    const entrypointConsumers = discoverEntrypointConsumers(engine, entrypoints, maps.callGraphMaps?.callGraph);
    engineEntrypoints.push({
      engine: engine.engine,
      path: engine.path,
      entrypoints,
      symbolConsumers: entrypointConsumers,
      unusedExports: entrypoints.filter((name) => (entrypointConsumers[name]?.consumerCount ?? 0) === 0),
      confidence: entrypoints.length ? "HIGH" : "MEDIUM",
      evidence: entrypoints.length ? ["entrypoints extracted from engine exports"] : ["engine entry file exists but named exports are indirect"]
    });

    engineOwnership.push({
      engine: engine.engine,
      path: engine.path,
      hasClaude,
      ...ownership,
      confidence: hasClaude ? "MEDIUM" : "LOW",
      evidence: hasClaude ? ["CLAUDE.md parsed"] : ["CLAUDE.md missing"]
    });

    engineSecurity.push({
      engine: engine.engine,
      writes: writes.length,
      rpcs: rpcs.length,
      edgeFunctions: edgeFunctions.length,
      externalApis: externalApis.length,
      riskTier: riskTier({ writes, rpcs, edgeFunctions, externalApis }),
      surfaces: { writes, rpcs, edgeFunctions, externalApis },
      confidence: "HIGH",
      evidence: ["engine security surfaces discovered from AST maps"]
    });

    engineConsumers.push({
      engine: engine.engine,
      consumers,
      confidence: consumers.length ? "HIGH" : "MEDIUM",
      evidence: consumers.length ? ["consumers derived from AST dependency map"] : ["no app consumers found"]
    });

    engineGraph.nodes.push({ id: `engine:${engine.engine}`, type: "EngineNode", engine: engine.engine, path: engine.path });
    for (const controller of controllers) {
      engineGraph.nodes.push({ id: `controller:${controller.relative}`, type: "ControllerNode", file: controller.relative });
      engineGraph.edges.push({ from: `engine:${engine.engine}`, to: `controller:${controller.relative}`, type: "OWNS_CONTROLLER" });
    }
    for (const dal of dals) {
      engineGraph.nodes.push({ id: `dal:${dal.relative}`, type: "DALNode", file: dal.relative });
      engineGraph.edges.push({ from: `engine:${engine.engine}`, to: `dal:${dal.relative}`, type: "OWNS_DAL" });
    }
    for (const rpc of rpcs) {
      engineGraph.nodes.push({ id: `rpc:${rpc.rpc}:${rpc.file}`, type: "RpcNode", file: rpc.file, rpc: rpc.rpc });
      engineGraph.edges.push({ from: `engine:${engine.engine}`, to: `rpc:${rpc.rpc}:${rpc.file}`, type: "USES_RPC" });
    }
    for (const edge of edgeFunctions) {
      engineGraph.nodes.push({ id: `edge:${edge.function}:${edge.file}`, type: "EdgeFunctionNode", file: edge.file, function: edge.function });
      engineGraph.edges.push({ from: `engine:${engine.engine}`, to: `edge:${edge.function}:${edge.file}`, type: "USES_EDGE_FUNCTION" });
    }
    for (const dependency of engineDependencies) {
      engineGraph.edges.push({ from: `engine:${engine.engine}`, to: dependency.to, type: "DEPENDS_ON_ENGINE" });
    }
  }

  return {
    engineMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      engines: engineMap.sort((a, b) => a.engine.localeCompare(b.engine))
    },
    engineGraph: {
      version: 1,
      generatedAt: new Date().toISOString(),
      nodes: dedupeBy(engineGraph.nodes, (node) => node.id),
      edges: dedupeBy(engineGraph.edges, (edge) => `${edge.from}:${edge.to}:${edge.type}`)
    },
    engineConsumerMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      engines: engineConsumers.sort((a, b) => a.engine.localeCompare(b.engine))
    },
    engineEntrypointMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      engines: engineEntrypoints.sort((a, b) => a.engine.localeCompare(b.engine))
    },
    engineOwnershipMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      engines: engineOwnership.sort((a, b) => a.engine.localeCompare(b.engine))
    },
    engineSecurityMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      engines: engineSecurity.sort((a, b) => a.engine.localeCompare(b.engine))
    },
    engineExecutionMap: buildEngineExecutionMap(engineConsumers, maps.callGraphMaps?.engineExecutionMap)
  };
}

async function listEngineRoots(config) {
  const root = path.join(config.repoRoot, "engines");
  if (!(await pathExists(root))) return [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => ({ engine: entry.name, path: toPosix(path.relative(config.repoRoot, path.join(root, entry.name))) }))
    .sort((a, b) => a.engine.localeCompare(b.engine));
}

function isEntrypoint(file, enginePath) {
  return file === `${enginePath}/index.js` || file.endsWith("/src/adapters/index.js") || file.endsWith("/src/index.js");
}

function discoverEntrypoints(engineRecords, entrypointRecords) {
  const exportedNames = new Set();

  for (const record of entrypointRecords) {
    for (const name of exportedNamesFromSource(record.source)) exportedNames.add(name);
    for (const declaration of record.callSymbols.declarations.filter((item) => item.exported)) {
      exportedNames.add(declaration.name);
    }
    for (const imported of record.callSymbols.imports) {
      if (imported.imported && imported.imported !== "default" && imported.imported !== "*") exportedNames.add(imported.imported);
    }
  }

  for (const record of engineRecords) {
    if (!record.relative.includes("/src/adapters/") && !record.relative.endsWith("/src/index.js")) continue;
    for (const name of exportedNamesFromSource(record.source)) exportedNames.add(name);
    for (const declaration of record.callSymbols.declarations.filter((item) => item.exported)) {
      exportedNames.add(declaration.name);
    }
  }

  return [...exportedNames].sort();
}

function exportedNamesFromSource(source) {
  const names = [];
  for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of match[1].split(",")) {
      const [left, right] = part.trim().split(/\s+as\s+/);
      const name = (right ?? left)?.trim();
      if (name) names.push(name);
    }
  }
  return names;
}

/**
 * For each exported symbol name in a engine's entrypoint list,
 * count how many non-engine files have an incoming CALLS edge targeting
 * a symbol with that name inside the engine path.
 *
 * Uses the barrel-resolved callgraph so re-export chains are counted correctly.
 */
function discoverEntrypointConsumers(engine, entrypoints, callGraph) {
  const result = {};
  if (!callGraph?.edges?.length || !entrypoints.length) {
    for (const name of entrypoints) result[name] = { consumerCount: 0, consumers: [], status: "UNKNOWN" };
    return result;
  }

  for (const symbolName of entrypoints) {
    const consumerFiles = new Set();

    for (const edge of callGraph.edges) {
      if (edge.type !== "CALLS") continue;
      // Target symbol name must match
      const toSymbol = edge.to.split("#").at(-1);
      if (toSymbol !== symbolName) continue;
      // Target file must be inside this engine
      const toIdBody = edge.to.split(":").slice(1).join(":");
      const toFile = toIdBody.split("#")[0];
      if (!toFile.startsWith(`${engine.path}/`)) continue;
      // Consumer must be outside the engine
      if (edge.file.startsWith(`${engine.path}/`)) continue;
      consumerFiles.add(edge.file);
    }

    result[symbolName] = {
      consumerCount: consumerFiles.size,
      consumers: [...consumerFiles].sort(),
      status: consumerFiles.size === 0 ? "UNUSED_EXPORT" : "ACTIVE",
    };
  }

  return result;
}

function discoverConsumers(engine, dependencyMap) {
  const engineOwner = `engine:${engine}`;
  const consumers = new Set();
  for (const dependency of dependencyMap.dependencies) {
    if (dependency.to === engineOwner && dependency.from !== engineOwner) consumers.add(dependency.from);
  }
  return [...consumers].sort();
}

function discoverEngineDependencies(engine, dependencyMap) {
  const engineOwner = `engine:${engine}`;
  return dependencyMap.dependencies.filter((dependency) => dependency.from === engineOwner && dependency.toKind === "engine");
}

function discoverExternalApis(records) {
  const apis = [];
  for (const record of records) {
    for (const edge of record.writes.edgeCalls) {
      if (edge.operation !== "edge_function") apis.push({ file: record.relative, ...edge });
    }
  }
  return apis;
}

function parseOwnership(text) {
  if (!text) return { ownership: null, responsibility: null, allowedConsumers: [], boundaryRules: [] };
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const responsibility = collectAfterHeading(lines, ["Engine Responsibilities", "Responsibilities"]).join(" ");
  const boundaryRules = lines.filter((line) => /^[-*]\s/.test(line) && /(never|must|only|do not|no app|framework|import)/i.test(line)).map(cleanBullet);
  const allowedConsumers = lines.filter((line) => /import .*@|apps should import|consumer/i.test(line)).map(cleanBullet);
  const ownership = lines.find((line) => /^#\s/.test(line))?.replace(/^#\s*/, "") ?? null;
  return { ownership, responsibility: responsibility || null, allowedConsumers, boundaryRules };
}

function collectAfterHeading(lines, headings) {
  const index = lines.findIndex((line) => headings.some((heading) => line.replace(/^#+\s*/, "") === heading));
  if (index === -1) return [];
  const values = [];
  for (const line of lines.slice(index + 1)) {
    if (/^#+\s/.test(line)) break;
    if (/^[-*]\s/.test(line) || line.length > 0) values.push(cleanBullet(line));
  }
  return values;
}

function cleanBullet(line) {
  return line.replace(/^[-*]\s*/, "").replace(/^#+\s*/, "").trim();
}

function riskTier({ writes, rpcs, edgeFunctions, externalApis }) {
  const score = writes.length + rpcs.length * 2 + edgeFunctions.length * 2 + externalApis.length;
  if (score >= 20) return "HIGH";
  if (score >= 5) return "MEDIUM";
  return "LOW";
}

function buildEngineExecutionMap(engineConsumers, existingEngineExecutionMap) {
  const existing = existingEngineExecutionMap?.engineExecutionPaths ?? [];
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    engineExecutionPaths: engineConsumers.flatMap((entry) => {
      const paths = existing.filter((path) => path.engine === `engine:${entry.engine}`);
      if (paths.length) return paths;
      return entry.consumers.map((consumer) => ({
        feature: consumer,
        engine: `engine:${entry.engine}`,
        imports: [],
        calls: [],
        confidence: entry.confidence,
        evidence: ["engine consumer discovered from dependency map"]
      }));
    })
  };
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
