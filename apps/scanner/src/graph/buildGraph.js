import { layerFromPath } from "../core/ownership.js";

const LAYER_NODE_TYPES = {
  controller: "ControllerNode",
  dal: "DALNode",
  model: "ModelNode",
  hook: "HookNode",
  adapter: "AdapterNode",
  screen: "ScreenNode",
  component: "ComponentNode"
};

export function buildGraph({ featureMap, dependencyMap, routeMap, writeSurfaceMap, testMap, sourceRecords = [], callGraphMaps = null }) {
  const nodes = new Map();
  const edges = [];

  for (const entry of featureMap.features) {
    if (entry.kind === "engine") {
      addNode(nodes, `engine:${entry.feature}`, "EngineNode", entry);
    } else if (entry.kind === "feature") {
      addNode(nodes, `${entry.app}:${entry.feature}`, "FeatureNode", entry);
    }
  }

  for (const route of routeMap.routes) {
    const id = `route:${route.app}:${route.route}:${route.file}`;
    addNode(nodes, id, "RouteNode", { ...route, routeType: route.routeType ?? route.type, routeAccess: route.routeAccess ?? route.access });
    if (route.app) edges.push({ from: `${route.app}:${featureFromFile(route.file)}`, to: id, type: "OWNS" });
  }

  for (const surface of writeSurfaceMap.writeSurfaces) {
    const id = `write:${surface.file}:${surface.operation}:${surface.table ?? surface.rpc ?? surface.functionName ?? "unknown"}`;
    addNode(nodes, id, "WriteSurfaceNode", surface);
    edges.push({ from: surface.owner, to: id, type: "WRITES" });

    const layer = layerFromPath(surface.file);
    const nodeType = LAYER_NODE_TYPES[layer];
    if (nodeType) addNode(nodes, `${layer}:${surface.file}`, nodeType, { file: surface.file, layer });
  }

  for (const record of sourceRecords) {
    const layer = layerFromPath(record.relative);
    const nodeType = LAYER_NODE_TYPES[layer];
    if (nodeType) addNode(nodes, `${layer}:${record.relative}`, nodeType, { file: record.relative, layer });
  }

  for (const test of testMap.tests) {
    const id = `test:${test.file}`;
    addNode(nodes, id, "TestNode", test);
    edges.push({ from: test.owner, to: id, type: "OWNS" });
  }

  for (const dependency of dependencyMap.dependencies) {
    edges.push({ from: dependency.from, to: dependency.to, type: "DEPENDS_ON", relationship: dependency.relationship });
    for (const item of dependency.imports) {
      edges.push({ from: dependency.from, to: dependency.to, type: "IMPORTS", file: item.file, importPath: item.importPath });
    }
  }

  if (callGraphMaps) {
    for (const node of callGraphMaps.callGraph.nodes) {
      addNode(nodes, node.id, LAYER_NODE_TYPES[node.layer] ?? "ComponentNode", node);
    }
    for (const edge of callGraphMaps.callGraph.edges) {
      edges.push({ from: edge.from, to: edge.to, type: "CALLS", confidence: edge.confidence });
    }
    for (const routePath of callGraphMaps.routeExecutionMap.routeExecutionPaths) {
      const routeId = `route:${routePath.app}:${routePath.route}:${routePath.file}`;
      if (routePath.path[0]) edges.push({ from: routeId, to: routePath.path[0], type: "ROUTES_TO", confidence: routePath.confidence });
      for (const symbol of routePath.path) {
        if (symbol.startsWith("hook:")) edges.push({ from: routeId, to: symbol, type: "USES_HOOK", confidence: routePath.confidence });
        if (symbol.startsWith("controller:")) edges.push({ from: routeId, to: symbol, type: "USES_CONTROLLER", confidence: routePath.confidence });
        if (symbol.startsWith("dal:")) edges.push({ from: routeId, to: symbol, type: "USES_DAL", confidence: routePath.confidence });
      }
      for (const rpc of routePath.rpcs) {
        const rpcId = `rpc:${rpc.rpc}:${rpc.file}`;
        addNode(nodes, rpcId, "WriteSurfaceNode", { id: rpcId, rpc: rpc.rpc, file: rpc.file });
        edges.push({ from: routeId, to: rpcId, type: "USES_RPC", confidence: routePath.confidence });
      }
      for (const edgeFunction of routePath.edgeFunctions) {
        const edgeId = `edge:${edgeFunction.function}:${edgeFunction.file}`;
        addNode(nodes, edgeId, "WriteSurfaceNode", { id: edgeId, function: edgeFunction.function, file: edgeFunction.file });
        edges.push({ from: routeId, to: edgeId, type: "USES_EDGE_FUNCTION", confidence: routePath.confidence });
      }
    }
    for (const trace of callGraphMaps.testTraceabilityMap.testTraceability) {
      for (const symbol of trace.path) edges.push({ from: `test:${trace.test}`, to: symbol, type: "TESTS", confidence: trace.confidence });
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: dedupeEdges(edges).sort((a, b) => `${a.from}:${a.to}:${a.type}`.localeCompare(`${b.from}:${b.to}:${b.type}`))
  };
}

function addNode(nodes, id, type, data) {
  if (!id || id.includes("undefined")) return;
  if (!nodes.has(id)) nodes.set(id, { ...data, id, type });
}

function featureFromFile(file) {
  return file.match(/^apps\/[^/]+\/src\/features\/([^/]+)/)?.[1] ?? "src";
}

function dedupeEdges(edges) {
  const seen = new Set();
  return edges.filter((edge) => {
    const key = JSON.stringify(edge);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
