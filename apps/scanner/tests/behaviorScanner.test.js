import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createScannerConfig } from "../src/core/config.js";
import { scanBehaviorGovernance } from "../src/scanners/behaviorScanner.js";

function makeRecord(relative, layer, declarations = []) {
  return {
    relative,
    appId: "VCSM",
    feature: "dashboard",
    layer,
    callSymbols: { declarations }
  };
}

test("behavior governance scanner builds module, behavior, surface, policy, and coverage maps", async () => {
  const repoRoot = path.resolve("tests/fixtures/behavior-governance");
  const config = createScannerConfig({
    scannerRoot: process.cwd(),
    repoRoot,
    docsRoot: path.join(repoRoot, "ZZnotforproduction/APPS/VCSM")
  });

  const controllerFile = "apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js";
  const dalFile = "apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal.js";
  const testFile = "apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/__tests__/vportLeads.controller.test.js";
  const records = [
    makeRecord(controllerFile, "controller", [{ name: "listVportLeadsController" }]),
    makeRecord(dalFile, "dal", [{ name: "deleteVportBusinessCardLeadDAL" }]),
    makeRecord(testFile, "module", [{ name: "rejectsNonOwner" }])
  ];

  const maps = {
    featureMap: {
      features: [
        {
          feature: "dashboard",
          appId: "VCSM",
          kind: "feature",
          path: "apps/VCSM/src/features/dashboard"
        }
      ]
    },
    routeMap: {
      routes: [
        {
          appId: "VCSM",
          feature: "dashboard",
          route: "/actor/:actorId/dashboard/leads",
          file: "apps/VCSM/src/App.jsx",
          access: "protected",
          elementName: "VportDashboardLeadsScreen"
        }
      ]
    },
    screenMap: {
      screens: []
    },
    writeSurfaceMap: {
      writeSurfaces: [
        {
          appId: "VCSM",
          feature: "dashboard",
          operation: "delete",
          schema: "vport",
          table: "business_card_leads",
          file: dalFile
        }
      ]
    },
    rpcMap: { rpcs: [] },
    edgeFunctionMap: { edgeFunctions: [] },
    testMap: {
      tests: [
        {
          appId: "VCSM",
          feature: "dashboard",
          file: testFile
        }
      ]
    },
    testTraceabilityMap: { testTraceability: [] }
  };

  const result = await scanBehaviorGovernance(config, records, maps);
  const leadsModule = result.behaviorMap.modules.find((item) => item.feature === "dashboard" && item.module === "leads");
  assert.equal(leadsModule.confidence, "HIGH");

  const behavior = result.behaviorMap.behaviors.find((item) => item.feature === "dashboard" && item.module === "leads");
  assert.ok(behavior);
  assert.match(behavior.behaviorId, /^BEH-DASHBOARD-LEADS-\d{3}$/);

  const surface = result.behaviorSurfaceMap.behaviorSurfaces.find((item) => item.behaviorId === behavior.behaviorId);
  assert.ok(surface.controllers.includes(controllerFile));
  assert.ok(surface.dals.includes(dalFile));
  assert.deepEqual(surface.tables, ["vport.business_card_leads"]);
  assert.ok(surface.tests.includes(testFile));

  const docs = result.behaviorDocumentMap.documents.find((item) => item.behaviorId === behavior.behaviorId);
  assert.equal(docs.missing.includes("BEHAVIOR.md"), false);

  const policies = result.policyMap.policies.filter((item) => item.behaviorId === behavior.behaviorId);
  assert.ok(policies.some((policy) => policy.type === "SECURITY_FINDING"));
  assert.ok(policies.some((policy) => policy.type === "MUST_NEVER_HAPPEN"));

  const coverage = result.behaviorCoverageMap.coverage.find((item) => item.behaviorId === behavior.behaviorId);
  assert.equal(coverage.architectureCoverage, "COMPLETE");
  assert.equal(coverage.securityCoverage, "COMPLETE");
  assert.equal(coverage.testCoverage, "PARTIAL");
});
