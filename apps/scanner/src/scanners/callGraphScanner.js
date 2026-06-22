import { findExistingPath, relativePath } from "../core/fs.js";
import { classifyPath, layerFromPath } from "../core/ownership.js";
import { resolveImport } from "../parsers/imports.js";
import { buildReexportIndex, resolveOriginSymbol } from "../resolvers/barrelResolver.js";

const MAX_DEPTH = 8;

export async function scanCallGraph(config, sourceRecords, maps) {
  const reexportIndex = await buildReexportIndex(config, sourceRecords);
  const index = await buildSymbolIndex(config, sourceRecords);
  const { edges: callEdges, barrelResolutions } = buildCallEdges(sourceRecords, index, reexportIndex);
  const reexportEdges = buildReexportEdges(reexportIndex, index);
  const barrelNodes = buildBarrelNodes(reexportIndex);
  const adjacency = groupBy(callEdges, "from");

  const routeExecutionPaths = buildRouteExecutionPaths(maps.routeMap, index, adjacency, maps);
  const writeExecutionPaths = buildWriteExecutionPaths(routeExecutionPaths, maps.writeSurfaceMap);
  const rpcExecutionPaths = buildRpcExecutionPaths(routeExecutionPaths, maps.rpcMap);
  const edgeExecutionPaths = buildEdgeExecutionPaths(routeExecutionPaths, maps.edgeFunctionMap);
  const testTraceability = buildTestTraceability(maps.testMap, index, adjacency, maps);
  const securityPaths = buildSecurityPaths(routeExecutionPaths, maps);
  const engineExecutionPaths = buildEngineExecutionPaths(maps.dependencyMap, callEdges);

  return {
    callGraph: {
      version: 1,
      generatedAt: new Date().toISOString(),
      nodes: [...index.symbols.values(), ...barrelNodes].sort((a, b) => a.id.localeCompare(b.id)),
      edges: [...callEdges, ...reexportEdges],
    },
    reexportIndex,
    barrelResolutions,
    routeExecutionMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      routeExecutionPaths
    },
    writeExecutionMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      writeExecutionPaths
    },
    rpcExecutionMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      rpcExecutionPaths
    },
    edgeExecutionMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      edgeExecutionPaths
    },
    testTraceabilityMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      testTraceability
    },
    securityPathMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      securityPaths
    },
    engineExecutionMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      engineExecutionPaths
    }
  };
}

async function buildSymbolIndex(config, sourceRecords) {
  const symbols = new Map();
  const fileRecords = new Map(sourceRecords.map((record) => [record.relative, record]));
  const importsByFile = new Map();

  for (const record of sourceRecords) {
    for (const declaration of record.callSymbols.declarations) {
      const id = symbolId(record.relative, declaration.name);
      symbols.set(id, {
        id,
        name: declaration.name,
        file: record.relative,
        layer: layerFromPath(record.relative),
        owner: classifyPath(record.relative).owner,
        exported: declaration.exported,
        defaultExport: declaration.defaultExport,
        confidence: "HIGH"
      });
    }

    const imports = new Map();
    for (const imported of record.callSymbols.imports) {
      const resolved = resolveImport({ importerPath: record.filePath, importPath: imported.importPath, repoRoot: config.repoRoot, aliases: config.aliases });
      const existingPath = resolved ? await findExistingPath(resolved) : null;
      const file = existingPath ? relativePath(config.repoRoot, existingPath) : resolved ? relativePath(config.repoRoot, resolved) : null;
      imports.set(imported.local, {
        ...imported,
        file,
        targetName: imported.imported === "default" ? null : imported.imported,
        confidence: existingPath ? "HIGH" : "MEDIUM"
      });
    }
    importsByFile.set(record.relative, imports);
  }

  return { symbols, fileRecords, importsByFile };
}

function buildCallEdges(sourceRecords, index, reexportIndex) {
  const edges = [];
  const barrelResolutions = [];

  for (const record of sourceRecords) {
    const imports = index.importsByFile.get(record.relative) ?? new Map();
    for (const call of record.callSymbols.calls) {
      const from = symbolId(record.relative, call.caller);
      const target = resolveCallTarget(record.relative, call.callee, imports, index, reexportIndex);
      if (!target) continue;
      const edge = {
        from,
        to: target.id,
        type: "CALLS",
        callKind: call.kind,
        file: record.relative,
        confidence: target.confidence,
        evidence: target.evidence,
      };
      if (target.via) edge.via = target.via;
      edges.push(edge);
      if (target.barrelResolution) barrelResolutions.push(target.barrelResolution);
    }
  }

  return {
    edges: dedupe(edges, (edge) => `${edge.from}:${edge.to}:${edge.callKind}`)
      .sort((a, b) => `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`)),
    barrelResolutions: dedupeBarrelResolutions(barrelResolutions),
  };
}

function resolveCallTarget(file, callee, imports, index, reexportIndex) {
  const local = index.symbols.get(symbolId(file, callee));
  if (local) return { id: local.id, confidence: "HIGH", evidence: ["local symbol call resolved"] };

  const imported = imports.get(callee);
  if (imported?.file) {
    const candidates = [...index.symbols.values()].filter((symbol) => symbol.file === imported.file);
    const named = imported.targetName ? candidates.find((symbol) => symbol.name === imported.targetName) : null;
    const fallback = candidates.find((symbol) => symbol.defaultExport) ?? candidates[0];
    const target = named ?? fallback;
    if (target) return { id: target.id, confidence: imported.confidence, evidence: ["imported symbol call resolved"] };

    // Barrel re-export fallback: imported file re-exports the symbol from an origin
    if (reexportIndex && imported.targetName) {
      const origin = resolveOriginSymbol(reexportIndex, imported.file, imported.targetName);
      if (origin) {
        const originSymbol = [...index.symbols.values()].find(
          (s) => s.file === origin.file && s.name === origin.symbolName
        );
        if (originSymbol) {
          return {
            id: originSymbol.id,
            confidence: "HIGH",
            evidence: ["imported symbol call resolved via barrel re-export chain"],
            via: [imported.file],
            barrelResolution: {
              consumer: file,
              importedSymbol: imported.targetName,
              importedFrom: imported.file,
              chain: [{ file: imported.file, symbol: imported.targetName, hop: 1 }],
              origin: { file: origin.file, symbolName: origin.symbolName },
              confidence: "HIGH",
            },
          };
        }
      }
    }
  }

  return null;
}

function buildRouteExecutionPaths(routeMap, index, adjacency, maps) {
  return routeMap.routes.map((route) => {
    const start = route.elementName ? resolveRouteElement(route, index) : null;
    const symbolPath = start ? traverse(start, adjacency) : [];
    const files = filesFromSymbols(symbolPath, index);
    const writes = maps.writeSurfaceMap.writeSurfaces.filter((surface) => files.has(surface.file));
    const rpcs = maps.rpcMap.rpcs.filter((rpc) => files.has(rpc.file));
    const edgeFunctions = maps.edgeFunctionMap.edgeFunctions.filter((edge) => files.has(edge.file));

    return {
      route: route.route,
      app: route.app,
      appId: route.appId,
      root: route.root,
      feature: route.feature,
      access: route.access,
      file: route.file,
      screen: start ? symbolName(start) : route.elementName,
      path: symbolPath,
      writes,
      rpcs,
      edgeFunctions,
      confidence: start ? "MEDIUM" : "LOW",
      evidence: start ? ["route element linked to symbol path"] : ["route discovered without executable element symbol"]
    };
  });
}

function buildWriteExecutionPaths(routePaths, writeSurfaceMap) {
  const linked = routePaths.flatMap((path) => path.writes.map((write) => ({
    appId: path.appId,
    root: path.root,
    feature: path.feature,
    sourceRoute: path.route,
    sourceScreen: path.screen,
    controller: firstLayer(path.path, "controller"),
    dal: firstLayer(path.path, "dal"),
    rpc: write.rpc,
    table: write.table,
    operation: write.operation,
    write,
    confidence: path.confidence,
    evidence: ["write surface connected to traversed route files"]
  })));

  const seen = new Set(linked.map((item) => `${item.operation}:${item.table ?? item.rpc ?? item.write?.functionName}:${item.write?.file}`));
  const unlinked = writeSurfaceMap.writeSurfaces
    .filter((write) => !seen.has(`${write.operation}:${write.table ?? write.rpc ?? write.functionName}:${write.file}`))
    .map((write) => ({
      appId: write.appId,
      root: write.root,
      feature: write.feature,
      sourceRoute: null,
      sourceScreen: null,
      controller: write.layer === "controller" ? write.file : null,
      dal: write.layer === "dal" ? write.file : null,
      rpc: write.rpc,
      table: write.table,
      operation: write.operation,
      write,
      confidence: "LOW",
      evidence: ["write surface discovered without resolved route execution path"]
    }));

  return [...linked, ...unlinked];
}

function buildRpcExecutionPaths(routePaths, rpcMap) {
  const routeLinked = routePaths.flatMap((path) => path.rpcs.map((rpc) => ({
    appId: path.appId,
    root: path.root,
    feature: path.feature,
    sourceRoute: path.route,
    sourceScreen: path.screen,
    controller: firstLayer(path.path, "controller"),
    dal: firstLayer(path.path, "dal"),
    rpc: rpc.rpc,
    file: rpc.file,
    caller: rpc.caller,
    confidence: path.confidence,
    evidence: ["RPC connected to traversed route files"]
  })));

  const seen = new Set(routeLinked.map((item) => `${item.rpc}:${item.file}`));
  const unlinked = rpcMap.rpcs
    .filter((rpc) => !seen.has(`${rpc.rpc}:${rpc.file}`))
    .map((rpc) => ({ appId: rpc.appId, root: rpc.root, feature: rpc.feature, rpc: rpc.rpc, file: rpc.file, caller: rpc.caller, confidence: "LOW", evidence: ["RPC discovered without route execution path"] }));

  return [...routeLinked, ...unlinked];
}

function buildEdgeExecutionPaths(routePaths, edgeFunctionMap) {
  const routeLinked = routePaths.flatMap((path) => path.edgeFunctions.map((edge) => ({
    appId: path.appId,
    root: path.root,
    feature: path.feature,
    sourceRoute: path.route,
    sourceScreen: path.screen,
    controller: firstLayer(path.path, "controller"),
    edgeFunction: edge.function,
    file: edge.file,
    caller: edge.caller,
    confidence: path.confidence,
    evidence: ["edge function connected to traversed route files"]
  })));

  const seen = new Set(routeLinked.map((item) => `${item.edgeFunction}:${item.file}`));
  const unlinked = edgeFunctionMap.edgeFunctions
    .filter((edge) => !seen.has(`${edge.function}:${edge.file}`))
    .map((edge) => ({ appId: edge.appId, root: edge.root, feature: edge.feature, edgeFunction: edge.function, file: edge.file, caller: edge.caller, confidence: "LOW", evidence: ["edge function discovered without route execution path"] }));

  return [...routeLinked, ...unlinked];
}

function buildTestTraceability(testMap, index, adjacency, maps) {
  return testMap.tests.map((test) => {
    const starts = [...index.symbols.values()].filter((symbol) => symbol.file === test.file).map((symbol) => symbol.id);
    const path = dedupe(starts.flatMap((start) => traverse(start, adjacency)), (item) => item);
    const files = filesFromSymbols(path, index);
    return {
      test: test.file,
      appId: test.appId,
      root: test.root,
      feature: test.feature,
      declarations: test.declarations ?? [],
      path,
      writes: maps.writeSurfaceMap.writeSurfaces.filter((surface) => files.has(surface.file)),
      rpcs: maps.rpcMap.rpcs.filter((rpc) => files.has(rpc.file)),
      confidence: path.length ? "MEDIUM" : "LOW",
      evidence: path.length ? ["test symbols linked to call path"] : ["test declarations found without resolved call path"]
    };
  });
}

function buildSecurityPaths(routePaths, maps) {
  const routeLinked = routePaths
    .filter((path) => path.writes.length || path.rpcs.length || path.edgeFunctions.length)
    .map((path) => ({
      route: path.route,
      appId: path.appId,
      root: path.root,
      feature: path.feature,
      access: path.access,
      controller: firstLayer(path.path, "controller"),
      writes: path.writes,
      rpcs: path.rpcs,
      edgeFunctions: path.edgeFunctions,
      confidence: path.confidence,
      evidence: ["potential attack surface path only; no finding asserted"]
    }));

  const linkedWriteKeys = new Set(routeLinked.flatMap((path) => path.writes.map((write) => `${write.operation}:${write.table ?? write.rpc ?? write.functionName}:${write.file}`)));
  const linkedRpcKeys = new Set(routeLinked.flatMap((path) => path.rpcs.map((rpc) => `${rpc.rpc}:${rpc.file}`)));
  const linkedEdgeKeys = new Set(routeLinked.flatMap((path) => path.edgeFunctions.map((edgeFunction) => `${edgeFunction.function}:${edgeFunction.file}`)));

  return [
    ...routeLinked,
    ...maps.writeSurfaceMap.writeSurfaces.filter((write) => !linkedWriteKeys.has(`${write.operation}:${write.table ?? write.rpc ?? write.functionName}:${write.file}`)).map((write) => ({
      appId: write.appId,
      root: write.root,
      feature: write.feature,
      route: null,
      access: "unknown",
      controller: write.layer === "controller" ? write.file : null,
      writes: [write],
      rpcs: [],
      edgeFunctions: [],
      confidence: "LOW",
      evidence: ["write surface discovered without route-confirmed path; potential surface only"]
    })),
    ...maps.rpcMap.rpcs.filter((rpc) => !linkedRpcKeys.has(`${rpc.rpc}:${rpc.file}`)).map((rpc) => ({
      appId: rpc.appId,
      root: rpc.root,
      feature: rpc.feature,
      route: null,
      access: "unknown",
      controller: null,
      writes: [],
      rpcs: [rpc],
      edgeFunctions: [],
      confidence: "LOW",
      evidence: ["RPC discovered without route-confirmed path; potential surface only"]
    })),
    ...maps.edgeFunctionMap.edgeFunctions.filter((edgeFunction) => !linkedEdgeKeys.has(`${edgeFunction.function}:${edgeFunction.file}`)).map((edgeFunction) => ({
      appId: edgeFunction.appId,
      root: edgeFunction.root,
      feature: edgeFunction.feature,
      route: null,
      access: "unknown",
      controller: null,
      writes: [],
      rpcs: [],
      edgeFunctions: [edgeFunction],
      confidence: "LOW",
      evidence: ["edge function discovered without route-confirmed path; potential surface only"]
    }))
  ];
}

function buildEngineExecutionPaths(dependencyMap, callEdges) {
  return dependencyMap.dependencies
    .filter((dependency) => dependency.toKind === "engine" || dependency.fromKind === "engine")
    .map((dependency) => ({
      feature: dependency.fromKind === "feature" ? dependency.from : null,
      appId: dependency.fromAppId ?? dependency.toAppId ?? null,
      engine: dependency.toKind === "engine" ? dependency.to : dependency.from,
      imports: dependency.imports,
      calls: callEdges.filter((edge) => dependency.imports.some((item) => edge.file === item.file)),
      confidence: dependency.confidence,
      evidence: ["engine consumer chain derived from imports and call edges"]
    }));
}

function resolveRouteElement(route, index) {
  const candidates = [...index.symbols.values()].filter((symbol) => symbol.file === route.file);
  return candidates.find((symbol) => symbol.name === route.elementName)?.id
    ?? candidates.find((symbol) => symbol.layer === "screen")?.id
    ?? candidates[0]?.id
    ?? null;
}

function traverse(start, adjacency) {
  const seen = new Set();
  const ordered = [];

  function visit(id, depth) {
    if (!id || seen.has(id) || depth > MAX_DEPTH) return;
    seen.add(id);
    ordered.push(id);
    for (const edge of adjacency.get(id) ?? []) visit(edge.to, depth + 1);
  }

  visit(start, 0);
  return ordered;
}

function filesFromSymbols(symbolPath, index) {
  return new Set(symbolPath.map((id) => index.symbols.get(id)?.file).filter(Boolean));
}

function firstLayer(symbolPath, layer) {
  return symbolPath.find((id) => id.startsWith(`${layer}:`)) ?? null;
}

/**
 * Build REEXPORTED_FROM edges: barrel node → origin declaration node.
 * These complement CALLS edges by making the relay structure explicit in the graph.
 */
function buildReexportEdges(reexportIndex, index) {
  const edges = [];

  for (const [barrelFile, fileMap] of reexportIndex) {
    for (const [key, entry] of fileMap) {
      if (key.startsWith("*:") || entry.kind === "wildcard" || entry.kind === "namespace") continue;
      const exportedName = key;

      const origin = resolveOriginSymbol(reexportIndex, barrelFile, exportedName);
      const targetFile = origin?.file ?? entry.fromFile;
      const targetSymbol = origin?.symbolName ?? entry.fromSymbol;

      const targetNode = [...index.symbols.values()].find(
        (s) => s.file === targetFile && s.name === targetSymbol
      );
      if (!targetNode) continue;

      edges.push({
        from: `barrel:${barrelFile}#${exportedName}`,
        to: targetNode.id,
        type: "REEXPORTED_FROM",
        callKind: "barrel",
        file: barrelFile,
        confidence: "HIGH",
        evidence: ["named re-export detected via AST"],
      });
    }
  }

  return edges;
}

/**
 * Build virtual barrel nodes for every named re-export.
 * These represent a symbol as it exists in the barrel layer —
 * distinct from the origin declaration node.
 */
function buildBarrelNodes(reexportIndex) {
  const nodes = [];
  const seen = new Set();

  for (const [barrelFile, fileMap] of reexportIndex) {
    for (const [key, entry] of fileMap) {
      if (key.startsWith("*:") || entry.kind === "wildcard" || entry.kind === "namespace") continue;
      const exportedName = key;
      const id = `barrel:${barrelFile}#${exportedName}`;
      if (seen.has(id)) continue;
      seen.add(id);
      nodes.push({
        id,
        name: exportedName,
        file: barrelFile,
        layer: "barrel",
        owner: classifyPath(barrelFile).owner,
        exported: true,
        defaultExport: false,
        confidence: "HIGH",
      });
    }
  }

  return nodes;
}

function dedupeBarrelResolutions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.consumer}:${item.importedSymbol}:${item.importedFrom}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function symbolId(file, name) {
  return `${layerFromPath(file)}:${file}#${name}`;
}

function symbolName(symbolIdValue) {
  return symbolIdValue.split("#").at(-1);
}

function groupBy(items, key) {
  const grouped = new Map();
  for (const item of items) {
    const value = item[key];
    grouped.set(value, [...(grouped.get(value) ?? []), item]);
  }
  return grouped;
}

function dedupe(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
