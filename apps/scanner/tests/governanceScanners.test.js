import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createScannerConfig } from "../src/core/config.js";
import { discoverGovernanceDocuments } from "../src/scanners/governanceUtils.js";
import { scanIdentityFlows } from "../src/scanners/identityFlowScanner.js";
import { scanDocumentationDrift } from "../src/scanners/documentationDriftScanner.js";
import { scanDbPolicies } from "../src/scanners/dbPolicyScanner.js";
import { scanFindings } from "../src/scanners/findingScanner.js";
import { scanBehaviorTestCoverage } from "../src/scanners/behaviorTestCoverageScanner.js";
import { scanRuntimeCosts } from "../src/scanners/runtimeCostScanner.js";
import { scanNativeParity } from "../src/scanners/nativeParityScanner.js";
import { scanBusinessImpact } from "../src/scanners/businessImpactScanner.js";
import { scanGovernanceGraph } from "../src/scanners/governanceGraphScanner.js";
import { validateGovernanceMaps } from "../src/validation/validateGovernanceMaps.js";

const repoRoot = path.resolve("tests/fixtures/behavior-governance");
const config = createScannerConfig({
  scannerRoot: process.cwd(),
  repoRoot,
  docsRoot: path.join(repoRoot, "ZZnotforproduction/APPS/VCSM")
});

const controllerFile = "apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js";
const dalFile = "apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal.js";
const testFile = "apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/__tests__/vportLeads.controller.test.js";

const behaviorMap = {
  features: [{ feature: "dashboard", modules: ["leads"], behaviorCount: 1 }],
  modules: [{ feature: "dashboard", module: "leads", confidence: "HIGH", evidence: [] }],
  behaviors: [{ behaviorId: "BEH-DASHBOARD-LEADS-001", feature: "dashboard", module: "leads", behaviorName: "View Leads", confidence: "HIGH", evidence: [] }]
};
const behaviorSurfaceMap = {
  behaviorSurfaces: [{
    behaviorId: "BEH-DASHBOARD-LEADS-001",
    feature: "dashboard",
    module: "leads",
    routes: [{ route: "/actor/:actorId/dashboard/leads", file: "apps/VCSM/src/App.jsx" }],
    screens: [],
    hooks: [],
    controllers: [controllerFile],
    dals: [dalFile],
    rpcs: [],
    edgeFunctions: [],
    tables: ["vport.business_card_leads"],
    writes: [{ operation: "delete", schema: "vport", table: "business_card_leads", file: dalFile }],
    tests: [testFile]
  }]
};
const policyMap = {
  policies: [{
    policyId: "POL-0001",
    behaviorId: "BEH-DASHBOARD-LEADS-001",
    type: "OWNERSHIP_GATES",
    severity: "HIGH",
    rule: "Owner must pass actor ownership before lead data is returned."
  }]
};
const ownershipMap = {
  ownership: [{
    behaviorId: "BEH-DASHBOARD-LEADS-001",
    featureOwner: "VCSM:dashboard",
    moduleOwner: "VCSM:dashboard/leads",
    codeOwner: "apps/VCSM/src/features/dashboard",
    securityOwner: "Security governance document"
  }]
};
const behaviorDocumentMap = {
  documents: [{
    behaviorId: "BEH-DASHBOARD-LEADS-001",
    documents: [{ document: "BEHAVIOR.md", file: "ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md" }]
  }]
};
const sourceRecords = [
  {
    relative: controllerFile,
    appId: "VCSM",
    feature: "dashboard",
    layer: "controller",
    source: "export function listVportLeadsController(actorId, callerActorId) { assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId }); }"
  },
  {
    relative: dalFile,
    appId: "VCSM",
    feature: "dashboard",
    layer: "dal",
    source: "export async function deleteLead(profileId) { await supabase.schema('vport').from('business_card_leads').delete().eq('id', profileId); }"
  }
];

test("identity scanner traces sensitive IDs and behavior links", () => {
  const result = scanIdentityFlows(sourceRecords, {
    behaviorSurfaceMap,
    writeSurfaceMap: { writeSurfaces: [{ appId: "VCSM", file: dalFile }] },
    rpcMap: { rpcs: [] },
    edgeFunctionMap: { edgeFunctions: [] }
  });
  assert.ok(result.identityFlows.some((flow) => flow.idName === "callerActorId"));
  assert.equal(result.behaviorIdentityFlows[0].behaviorId, "BEH-DASHBOARD-LEADS-001");
});

test("documentation drift scanner reports arrays without breaking known docs", async () => {
  const docs = await discoverGovernanceDocuments(config);
  const result = scanDocumentationDrift(sourceRecords, docs, { behaviorMap, behaviorSurfaceMap, behaviorDocumentMap });
  assert.ok(Array.isArray(result.drift));
});

test("db policy scanner maps DAL table to migration RLS evidence", async () => {
  const result = await scanDbPolicies(config, {
    writeSurfaceMap: { writeSurfaces: [{ appId: "VCSM", file: dalFile, operation: "delete", schema: "vport", table: "business_card_leads" }] },
    rpcMap: { rpcs: [{ appId: "VCSM", file: dalFile, schema: "vport", rpc: "submit_business_card_lead" }] }
  });
  assert.equal(result.dalDependencies[0].status, "VERIFIED");
  assert.equal(result.dalDependencies[0].rlsEnabled, true);
  assert.equal(result.rpcDependencies[0].securityDefiner, true);
});

test("finding scanner extracts normalized security findings", async () => {
  const docs = await discoverGovernanceDocuments(config);
  const result = scanFindings(docs, { behaviorMap });
  assert.ok(result.findings.some((finding) => finding.findingId === "VEN-LEADS-001"));
});

test("behavior test coverage scanner flags missing ownership negative naming", () => {
  const result = scanBehaviorTestCoverage({ behaviorSurfaceMap, policyMap, testMap: { tests: [{ file: testFile, declarations: [{ name: "happy path" }] }] } });
  assert.ok(result.behaviorTestCoverage[0].gaps.includes("OWNERSHIP_BEHAVIOR_WITHOUT_NEGATIVE_TEST"));
});

test("runtime cost scanner emits inferred static findings", () => {
  const result = scanRuntimeCosts(sourceRecords, { behaviorSurfaceMap });
  assert.ok(Array.isArray(result.runtimeCosts[0].findings));
});

test("native parity scanner maps web behavior to native token evidence", async () => {
  const result = await scanNativeParity(config, { behaviorMap });
  assert.equal(result.nativeParity[0].behaviorId, "BEH-DASHBOARD-LEADS-001");
});

test("business impact scanner classifies PII public lead behavior", () => {
  const result = scanBusinessImpact({ behaviorSurfaceMap, findingMap: { findings: [] }, policyMap });
  assert.ok(["MEDIUM", "HIGH", "CRITICAL"].includes(result.businessImpact[0].businessImpact));
});

test("governance graph scanner unifies behavior, policy, finding, owner, and surface nodes", () => {
  const findingMap = { findings: [{ findingId: "VEN-LEADS-001", behaviorId: "BEH-DASHBOARD-LEADS-001", status: "OPEN" }] };
  const graph = scanGovernanceGraph({ behaviorMap, behaviorSurfaceMap, behaviorDocumentMap, ownershipMap, policyMap, findingMap });
  assert.ok(graph.nodes.some((node) => node.type === "Finding"));
  assert.ok(graph.edges.some((edge) => edge.type === "VIOLATES"));
});

test("governance validator checks required map shapes", () => {
  const wrapped = {
    "behavior-map.json": { data: behaviorMap },
    "policy-map.json": { data: policyMap },
    "identity-flow-map.json": { data: { identityFlows: [], behaviorIdentityFlows: [], riskFindings: [] } },
    "ownership-map.json": { data: ownershipMap },
    "documentation-drift-map.json": { data: { drift: [] } },
    "db-policy-map.json": { data: { tables: [], rpcs: [], dalDependencies: [], rpcDependencies: [], unverified: [] } },
    "finding-map.json": { data: { findings: [] } },
    "behavior-test-coverage-map.json": { data: { behaviorTestCoverage: [] } },
    "runtime-cost-map.json": { data: { runtimeCosts: [] } },
    "native-parity-map.json": { data: { nativeParity: [] } },
    "business-impact-map.json": { data: { businessImpact: [] } },
    "governance-graph.json": { data: { nodes: [], edges: [] } }
  };
  assert.equal(validateGovernanceMaps(wrapped).every((result) => result.status === "PASS"), true);
});
