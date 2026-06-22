export function scanBehaviorTestCoverage(maps) {
  const coverage = maps.behaviorSurfaceMap.behaviorSurfaces.map((surface) => {
    const testNames = testNamesForSurface(surface, maps.testMap.tests);
    const isSecurityBehavior = hasSecurity(surface, maps.policyMap.policies);
    const isOwnershipBehavior = hasOwnership(surface, maps.policyMap.policies);
    const isWriteBehavior = Boolean(surface.writes?.length || surface.rpcs?.length || surface.edgeFunctions?.length);
    const gaps = [];

    if (!surface.tests?.length) gaps.push("BEHAVIOR_WITHOUT_TEST");
    if (isSecurityBehavior && !testNames.some((name) => /security|auth|owner|reject|unauthor/i.test(name))) gaps.push("SECURITY_BEHAVIOR_WITHOUT_SECURITY_TEST");
    if (isOwnershipBehavior && !testNames.some((name) => /reject|non.?owner|unauthor|forbid|deny/i.test(name))) gaps.push("OWNERSHIP_BEHAVIOR_WITHOUT_NEGATIVE_TEST");
    if (isWriteBehavior && !testNames.some((name) => /regression|write|update|delete|insert|rpc/i.test(name))) gaps.push("WRITE_BEHAVIOR_WITHOUT_REGRESSION_TEST");

    return {
      behaviorId: surface.behaviorId,
      feature: surface.feature,
      module: surface.module,
      testRequirements: buildRequirements({ isSecurityBehavior, isOwnershipBehavior, isWriteBehavior }),
      tests: (surface.tests ?? []).map((file) => ({ file, testNames: testNamesForFile(file, maps.testMap.tests) })),
      gaps,
      coverage: gaps.length ? (surface.tests?.length ? "PARTIAL" : "MISSING") : "COMPLETE"
    };
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    behaviorTestCoverage: coverage
  };
}

function testNamesForSurface(surface, tests) {
  return (surface.tests ?? []).flatMap((file) => testNamesForFile(file, tests));
}

function testNamesForFile(file, tests) {
  const test = tests.find((item) => item.file === file);
  return (test?.declarations ?? []).map((decl) => decl.name ?? decl.call ?? "unnamed test");
}

function hasSecurity(surface, policies) {
  return policies.some((policy) => policy.behaviorId === surface.behaviorId && /SECURITY|MUST_NEVER|AUTH|FINDING/i.test(policy.type));
}

function hasOwnership(surface, policies) {
  return policies.some((policy) => policy.behaviorId === surface.behaviorId && /OWNER|OWNERSHIP|ACTOR/i.test(`${policy.type} ${policy.rule}`));
}

function buildRequirements({ isSecurityBehavior, isOwnershipBehavior, isWriteBehavior }) {
  return [
    "TESTREQ-BEHAVIOR-HAPPY-PATH",
    isSecurityBehavior ? "TESTREQ-SECURITY-NEGATIVE" : null,
    isOwnershipBehavior ? "TESTREQ-OWNERSHIP-NON-OWNER" : null,
    isWriteBehavior ? "TESTREQ-WRITE-REGRESSION" : null
  ].filter(Boolean);
}
