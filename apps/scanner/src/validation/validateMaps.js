const ALLOWED_NODE_TYPES = new Set([
  "FeatureNode",
  "EngineNode",
  "RouteNode",
  "ControllerNode",
  "DALNode",
  "ModelNode",
  "HookNode",
  "AdapterNode",
  "ScreenNode",
  "ComponentNode",
  "TestNode",
  "WriteSurfaceNode"
]);

const ALLOWED_EDGE_TYPES = new Set([
  "USES",
  "IMPORTS",
  "OWNS",
  "WRITES",
  "CALLS",
  "DEPENDS_ON",
  "ROUTES_TO",
  "USES_HOOK",
  "USES_CONTROLLER",
  "USES_DAL",
  "USES_RPC",
  "USES_EDGE_FUNCTION",
  "TESTS"
]);
const CONFIDENCE = new Set(["HIGH", "MEDIUM", "LOW", "BLOCKED"]);

export function validateMaps(maps) {
  const results = [];

  for (const [fileName, map] of Object.entries(maps)) {
    results.push(validateEnvelope(fileName, map));
  }

  results.push(validateGraph(maps["graph.json"]));
  results.push(validateConfidence("dependency-map.json", maps["dependency-map.json"].data.dependencies));
  results.push(validateConfidence("route-map.json", maps["route-map.json"].data.routes));
  results.push(validateConfidence("write-surface-map.json", maps["write-surface-map.json"].data.writeSurfaces));
  results.push(validateConfidence("rpc-map.json", maps["rpc-map.json"].data.rpcs));
  results.push(validateConfidence("edge-function-map.json", maps["edge-function-map.json"].data.edgeFunctions));
  results.push(validateConfidence("engine-candidates.json", maps["engine-candidates.json"].data.engineCandidates));
  results.push(validateConfidence("screen-map.json", maps["screen-map.json"].data.screens));

  return results;
}

export function confidenceDistribution(items) {
  return items.reduce((acc, item) => {
    const confidence = item.confidence ?? "LOW";
    acc[confidence] = (acc[confidence] ?? 0) + 1;
    return acc;
  }, {});
}

function validateEnvelope(fileName, map) {
  const errors = [];
  if (map.version !== 1) errors.push("missing version 1");
  if (!map.scannerVersion) errors.push("missing scannerVersion");
  if (!isIsoDate(map.generatedAt)) errors.push("invalid generatedAt");
  if (!map.root) errors.push("missing root");
  if (typeof map.scanDurationMs !== "number") errors.push("missing scanDurationMs");
  if (!CONFIDENCE.has(map.confidence)) errors.push("invalid confidence");
  if (!map.data || typeof map.data !== "object") errors.push("missing data object");
  return { scope: fileName, status: errors.length ? "FAIL" : "PASS", errors };
}

function validateGraph(graphMap) {
  const errors = [];
  for (const node of graphMap.data.nodes) {
    if (!ALLOWED_NODE_TYPES.has(node.type)) errors.push(`invalid node type ${node.type}`);
    if (node.id?.startsWith("route:") && node.type !== "RouteNode") errors.push(`route node type overwritten for ${node.id}`);
  }
  for (const edge of graphMap.data.edges) {
    if (!ALLOWED_EDGE_TYPES.has(edge.type)) errors.push(`invalid edge type ${edge.type}`);
  }
  return { scope: "graph semantics", status: errors.length ? "FAIL" : "PASS", errors };
}

function validateConfidence(scope, items) {
  const errors = items.filter((item) => item.confidence && !CONFIDENCE.has(item.confidence)).map((item) => `invalid confidence ${item.confidence}`);
  return { scope: `${scope} confidence`, status: errors.length ? "FAIL" : "PASS", errors };
}

function isIsoDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
