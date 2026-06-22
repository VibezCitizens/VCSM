import { surfaceFiles } from "./governanceUtils.js";

export function scanGovernanceGraph(maps) {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  function node(id, type, data = {}) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({ id, type, ...data });
  }

  for (const feature of maps.behaviorMap.features) {
    node(`feature:${feature.feature}`, "Feature", feature);
  }
  for (const module of maps.behaviorMap.modules) {
    node(`module:${module.feature}:${module.module}`, "Module", module);
    edges.push(edge(`feature:${module.feature}`, `module:${module.feature}:${module.module}`, "OWNS"));
  }
  for (const behavior of maps.behaviorMap.behaviors) {
    const behaviorNode = `behavior:${behavior.behaviorId}`;
    node(behaviorNode, "Behavior", behavior);
    edges.push(edge(`module:${behavior.feature}:${behavior.module}`, behaviorNode, "OWNS"));

    const surface = maps.behaviorSurfaceMap.behaviorSurfaces.find((item) => item.behaviorId === behavior.behaviorId);
    if (surface) {
      for (const route of surface.routes ?? []) connect(behaviorNode, `route:${route.route}`, "Route", route, "IMPLEMENTS");
      for (const screen of surface.screens ?? []) connect(behaviorNode, `screen:${screen.file}`, "Screen", screen, "IMPLEMENTS");
      for (const file of surface.hooks ?? []) connect(behaviorNode, `hook:${file}`, "Hook", { file }, "IMPLEMENTS");
      for (const file of surface.controllers ?? []) connect(behaviorNode, `controller:${file}`, "Controller", { file }, "IMPLEMENTS");
      for (const file of surface.dals ?? []) connect(behaviorNode, `dal:${file}`, "DAL", { file }, "IMPLEMENTS");
      for (const rpc of surface.rpcs ?? []) connect(behaviorNode, `rpc:${rpc.rpc}`, "RPC", rpc, "CALLS");
      for (const fn of surface.edgeFunctions ?? []) connect(behaviorNode, `edge:${fn.edgeFunction}`, "EdgeFunction", fn, "CALLS");
      for (const table of surface.tables ?? []) connect(behaviorNode, `table:${table}`, "Table", { table }, "WRITES");
      for (const test of surface.tests ?? []) connect(behaviorNode, `test:${test}`, "Test", { file: test }, "TESTS");
      for (const file of surfaceFiles(surface)) connect(behaviorNode, `code:${file}`, "CodeSurface", { file }, "DEPENDS_ON");
    }

    for (const docMap of maps.behaviorDocumentMap.documents.filter((item) => item.behaviorId === behavior.behaviorId)) {
      for (const doc of docMap.documents) connect(behaviorNode, `document:${doc.file}`, "Document", doc, "DOCUMENTED_BY");
    }
    for (const policy of maps.policyMap.policies.filter((item) => item.behaviorId === behavior.behaviorId)) {
      connect(behaviorNode, `policy:${policy.policyId}`, "Policy", policy, "ENFORCES");
    }
    for (const finding of maps.findingMap.findings.filter((item) => item.behaviorId === behavior.behaviorId)) {
      connect(behaviorNode, `finding:${finding.findingId}`, "Finding", finding, finding.status === "OPEN" ? "VIOLATES" : "AFFECTED_BY");
    }
    const owner = maps.ownershipMap.ownership.find((item) => item.behaviorId === behavior.behaviorId);
    if (owner) {
      for (const ownerValue of [owner.featureOwner, owner.moduleOwner, owner.securityOwner, owner.dataOwner, owner.decisionOwner, owner.documentationOwner].filter(Boolean)) {
        connect(behaviorNode, `owner:${ownerValue}`, "Owner", { owner: ownerValue }, "OWNS");
      }
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    nodes,
    edges
  };

  function connect(from, id, type, data, edgeType) {
    node(id, type, data);
    edges.push(edge(from, id, edgeType));
  }
}

function edge(from, to, type) {
  return { from, to, type };
}
