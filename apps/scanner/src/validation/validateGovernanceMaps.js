const REQUIRED = {
  "behavior-map.json": ["features", "modules", "behaviors"],
  "policy-map.json": ["policies"],
  "identity-flow-map.json": ["identityFlows", "behaviorIdentityFlows", "riskFindings"],
  "ownership-map.json": ["ownership"],
  "documentation-drift-map.json": ["drift"],
  "db-policy-map.json": ["tables", "rpcs", "dalDependencies", "rpcDependencies", "unverified"],
  "finding-map.json": ["findings"],
  "behavior-test-coverage-map.json": ["behaviorTestCoverage"],
  "runtime-cost-map.json": ["runtimeCosts"],
  "native-parity-map.json": ["nativeParity"],
  "business-impact-map.json": ["businessImpact"],
  "governance-graph.json": ["nodes", "edges"]
};

const FINDING_STATUSES = new Set(["OPEN", "FIXED", "VERIFIED", "DEFERRED", "FALSE_POSITIVE", "ACCEPTED_RISK", "BLOCKED"]);
const IMPACT = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export function validateGovernanceMaps(maps) {
  const results = [];
  for (const [fileName, fields] of Object.entries(REQUIRED)) {
    const map = maps[fileName];
    const errors = [];
    if (!map?.data) {
      errors.push("missing map data");
    } else {
      for (const field of fields) {
        if (!Array.isArray(map.data[field])) errors.push(`missing array ${field}`);
      }
    }
    results.push({ scope: fileName, status: errors.length ? "FAIL" : "PASS", errors });
  }

  const findingErrors = (maps["finding-map.json"]?.data?.findings ?? [])
    .filter((finding) => !FINDING_STATUSES.has(finding.status))
    .map((finding) => `invalid finding status ${finding.findingId}:${finding.status}`);
  results.push({ scope: "finding statuses", status: findingErrors.length ? "FAIL" : "PASS", errors: findingErrors });

  const impactErrors = (maps["business-impact-map.json"]?.data?.businessImpact ?? [])
    .filter((entry) => !IMPACT.has(entry.businessImpact))
    .map((entry) => `invalid business impact ${entry.behaviorId}:${entry.businessImpact}`);
  results.push({ scope: "business impact levels", status: impactErrors.length ? "FAIL" : "PASS", errors: impactErrors });

  return results;
}
