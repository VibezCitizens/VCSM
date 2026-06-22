const CONFIDENCE = new Set(["HIGH", "MEDIUM", "LOW", "BLOCKED"]);
const RISK_TIERS = new Set(["LOW", "MEDIUM", "HIGH"]);

export function validateEngineMaps(maps) {
  const engineMap = maps["engine-map.json"].data.engines;
  const ownershipMap = maps["engine-ownership-map.json"].data.engines;
  const securityMap = maps["engine-security-map.json"].data.engines;
  const consumerMap = maps["engine-consumer-map.json"].data.engines;
  const entrypointMap = maps["engine-entrypoint-map.json"].data.engines;

  return {
    schemaResults: [
      validateUniqueEngines("engine-map.json", engineMap),
      validateUniqueEngines("engine-consumer-map.json", consumerMap),
      validateUniqueEngines("engine-entrypoint-map.json", entrypointMap),
      validateUniqueEngines("engine-ownership-map.json", ownershipMap),
      validateUniqueEngines("engine-security-map.json", securityMap),
      validateEngineGraph(maps["engine-graph.json"].data),
      validateExecutionMap(maps["engine-execution-map.json"].data)
    ],
    ownershipResults: validateOwnership(engineMap, ownershipMap),
    securityResults: validateSecurity(securityMap),
    readinessResults: scoreReadiness({ engineMap, ownershipMap, securityMap, consumerMap, entrypointMap })
  };
}

export function engineConfidence({ hasFolder, consumers, executionPaths }) {
  if (hasFolder && consumers > 0 && executionPaths > 0) return "HIGH";
  if (consumers > 0) return "MEDIUM";
  if (hasFolder) return "LOW";
  return "BLOCKED";
}

function validateUniqueEngines(scope, engines) {
  const errors = [];
  const seen = new Set();
  for (const entry of engines) {
    if (!entry.engine) errors.push("missing engine name");
    if (entry.engine && seen.has(entry.engine)) errors.push(`duplicate engine ${entry.engine}`);
    if (entry.engine) seen.add(entry.engine);
    if (entry.confidence && !CONFIDENCE.has(entry.confidence)) errors.push(`invalid confidence ${entry.engine}:${entry.confidence}`);
  }
  return result(scope, errors);
}

function validateEngineGraph(graph) {
  const errors = [];
  for (const node of graph.nodes) {
    if (!node.id || !node.type) errors.push("graph node missing id/type");
  }
  for (const edge of graph.edges) {
    if (!edge.from || !edge.to || !edge.type) errors.push("graph edge missing from/to/type");
  }
  return result("engine-graph.json", errors);
}

function validateExecutionMap(map) {
  const errors = [];
  for (const path of map.engineExecutionPaths) {
    if (!path.engine) errors.push("engine execution path missing engine");
    if (!CONFIDENCE.has(path.confidence)) errors.push(`invalid execution confidence ${path.confidence}`);
  }
  return result("engine-execution-map.json", errors);
}

function validateOwnership(engineMap, ownershipMap) {
  return engineMap.map((engine) => {
    const ownership = ownershipMap.find((entry) => entry.engine === engine.engine);
    const warnings = [];
    if (!ownership?.hasClaude) warnings.push("CLAUDE.md missing");
    if (!ownership?.ownership) warnings.push("ownership missing");
    if (!ownership?.responsibility) warnings.push("responsibility missing");
    const score = Math.round((
      Number(Boolean(ownership?.hasClaude)) +
      Number(Boolean(ownership?.ownership)) +
      Number(Boolean(ownership?.responsibility))
    ) / 3 * 100);
    return {
      engine: engine.engine,
      score,
      status: warnings.length ? "WARNING" : "PASS",
      warnings
    };
  });
}

function validateSecurity(securityMap) {
  return securityMap.map((entry) => {
    const errors = [];
    if (!RISK_TIERS.has(entry.riskTier)) errors.push(`invalid risk tier ${entry.riskTier}`);
    for (const key of ["writes", "rpcs", "edgeFunctions", "externalApis"]) {
      if (typeof entry[key] !== "number") errors.push(`${key} count missing`);
    }
    return {
      engine: entry.engine,
      riskTier: entry.riskTier,
      writes: entry.writes,
      rpcs: entry.rpcs,
      edgeFunctions: entry.edgeFunctions,
      externalApis: entry.externalApis,
      status: errors.length ? "FAIL" : "PASS",
      errors
    };
  });
}

function scoreReadiness({ engineMap, ownershipMap, securityMap, consumerMap, entrypointMap }) {
  return engineMap.map((engine) => {
    const ownership = ownershipMap.find((entry) => entry.engine === engine.engine);
    const security = securityMap.find((entry) => entry.engine === engine.engine);
    const consumer = consumerMap.find((entry) => entry.engine === engine.engine);
    const entrypoint = entrypointMap.find((entry) => entry.engine === engine.engine);
    const ownershipScore = scoreOwnership(ownership);
    const consumerScore = Math.min((consumer?.consumers.length ?? 0) * 15, 100);
    const testScore = engine.tests > 0 ? 100 : 0;
    const securityScore = scoreSecurity(security);
    const entrypointScore = entrypoint?.entrypoints.length ? 100 : 0;
    const score = Math.round(
      ownershipScore * 0.25 +
      consumerScore * 0.2 +
      testScore * 0.15 +
      securityScore * 0.2 +
      entrypointScore * 0.2
    );

    return {
      engine: engine.engine,
      score,
      components: {
        ownership: ownershipScore,
        consumers: consumerScore,
        tests: testScore,
        security: securityScore,
        entrypoints: entrypointScore
      }
    };
  }).sort((a, b) => b.score - a.score);
}

function scoreOwnership(ownership) {
  return Math.round((
    Number(Boolean(ownership?.hasClaude)) +
    Number(Boolean(ownership?.ownership)) +
    Number(Boolean(ownership?.responsibility))
  ) / 3 * 100);
}

function scoreSecurity(security) {
  if (!security) return 0;
  if (security.riskTier === "LOW") return 100;
  if (security.riskTier === "MEDIUM") return 75;
  return 50;
}

function result(scope, errors) {
  return { scope, status: errors.length ? "FAIL" : "PASS", errors };
}
