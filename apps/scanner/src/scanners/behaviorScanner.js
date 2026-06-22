import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, relativePath, toPosix } from "../core/fs.js";

const SUPPORTED_DOCS = new Set(["ARCHITECTURE.md", "BEHAVIOR.md", "SECURITY.md", "CURRENT_STATUS.md", "README.md"]);
const LAYER_SEGMENTS = new Set([
  "__tests__",
  "adapter",
  "adapters",
  "api",
  "components",
  "controller",
  "controllers",
  "dal",
  "hooks",
  "lib",
  "model",
  "models",
  "queries",
  "screen",
  "screens",
  "services",
  "setup",
  "store",
  "styles",
  "ui",
  "usecases",
  "widgets"
]);
const POLICY_HEADINGS = [
  "security rules",
  "ownership gates",
  "authorization",
  "must never happen",
  "failure paths",
  "acceptance criteria",
  "open questions",
  "invariants"
];
const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "CAUTION", "BLOCKER"];

export async function scanBehaviorGovernance(config, sourceRecords, maps) {
  const vcsmFeatures = maps.featureMap.features.filter((feature) => feature.appId === "VCSM" && feature.kind === "feature");
  const docs = await discoverGovernanceDocs(config);
  const moduleEvidence = buildModuleEvidence(vcsmFeatures, sourceRecords, maps, docs);
  const modules = [...moduleEvidence.values()].map((module) => finalizeModule(module)).sort(byFeatureModule);
  const discoveredBehaviors = buildBehaviors(modules, sourceRecords, maps, docs);
  const surfaceMap = buildBehaviorSurfaceMap(discoveredBehaviors, modules, sourceRecords, maps);
  const behaviors = attachCodeSurfaces(discoveredBehaviors, surfaceMap.behaviorSurfaces);
  const documentMap = buildBehaviorDocumentMap(behaviors, docs);
  const ownershipMap = buildOwnershipMap(behaviors, docs);
  const policyMap = buildPolicyMap(behaviors, docs);
  const coverageMap = buildCoverageMap(behaviors, surfaceMap.behaviorSurfaces, documentMap.documents, ownershipMap.ownership, policyMap.policies);
  const governanceGraph = buildGovernanceGraph(behaviors, modules, surfaceMap.behaviorSurfaces, policyMap.policies);

  return {
    behaviorMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      appId: "VCSM",
      features: modulesToFeatures(modules, behaviors),
      modules,
      behaviors
    },
    behaviorSurfaceMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      behaviorSurfaces: surfaceMap.behaviorSurfaces
    },
    behaviorDocumentMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      documents: documentMap.documents
    },
    ownershipMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      ownership: ownershipMap.ownership
    },
    policyMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      policies: policyMap.policies
    },
    behaviorCoverageMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      coverage: coverageMap.coverage
    },
    governanceGraph: {
      version: 1,
      generatedAt: new Date().toISOString(),
      nodes: governanceGraph.nodes,
      edges: governanceGraph.edges
    }
  };
}

async function discoverGovernanceDocs(config) {
  const docs = [];
  const root = config.docsRoot;
  if (!(await pathExists(root))) return docs;

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(next);
      } else if (SUPPORTED_DOCS.has(entry.name)) {
        const relative = relativePath(config.repoRoot, next);
        const text = await fs.readFile(next, "utf8");
        docs.push({
          document: entry.name,
          file: relative,
          feature: featureFromDocPath(relative),
          module: moduleFromDocPath(relative),
          coverageType: docCoverageType(entry.name),
          text,
          lines: text.split(/\r?\n/)
        });
      }
    }
  }

  await walk(root);
  return docs.sort((a, b) => a.file.localeCompare(b.file));
}

function buildModuleEvidence(features, sourceRecords, maps, docs) {
  const moduleEvidence = new Map();

  for (const feature of features) {
    addModule(moduleEvidence, {
      feature: feature.feature,
      module: feature.feature,
      confidence: "MEDIUM",
      evidence: [`feature-map source: ${feature.path}`]
    });
  }

  for (const doc of docs) {
    if (!doc.feature) continue;
    addModule(moduleEvidence, {
      feature: doc.feature,
      module: doc.module ?? doc.feature,
      confidence: doc.module ? "HIGH" : "MEDIUM",
      evidence: [`governance document: ${doc.file}`]
    });
  }

  for (const record of sourceRecords.filter((record) => record.appId === "VCSM" && record.feature)) {
    const module = moduleFromSourcePath(record.relative, record.feature);
    addModule(moduleEvidence, {
      feature: record.feature,
      module,
      confidence: module === record.feature ? "MEDIUM" : "HIGH",
      evidence: [`source ${record.layer}: ${record.relative}`]
    });
  }

  for (const route of maps.routeMap.routes.filter((route) => route.appId === "VCSM" && route.feature)) {
    const module = moduleFromRoute(route.route, route.feature);
    addModule(moduleEvidence, {
      feature: route.feature,
      module,
      confidence: module === route.feature ? "MEDIUM" : "HIGH",
      evidence: [`route: ${route.route}`]
    });
  }

  return moduleEvidence;
}

function buildBehaviors(modules, sourceRecords, maps, docs) {
  const drafts = [];

  for (const module of modules) {
    drafts.push(...behaviorsFromDocs(module, docs));
    drafts.push(...behaviorsFromSource(module, sourceRecords));
    drafts.push(...behaviorsFromRoutes(module, maps.routeMap.routes));
    drafts.push(...behaviorsFromWrites(module, maps.writeSurfaceMap.writeSurfaces));
  }

  const grouped = new Map();
  for (const draft of drafts) {
    const key = `${draft.feature}:${draft.module}:${normalizeKey(draft.behaviorName)}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, draft);
      continue;
    }
    existing.evidence.push(...draft.evidence);
    existing.confidence = maxConfidence(existing.confidence, draft.confidence);
    existing.sourceBehaviorIds = [...new Set([...(existing.sourceBehaviorIds ?? []), ...(draft.sourceBehaviorIds ?? [])])];
  }

  const byModule = group([...grouped.values()].sort(byFeatureModuleName), (behavior) => `${behavior.feature}:${behavior.module}`);
  const behaviors = [];
  for (const [moduleKey, items] of byModule) {
    items.forEach((behavior, index) => {
      const [, moduleName] = moduleKey.split(":");
      behaviors.push({
        behaviorId: `BEH-${slugId(behavior.feature)}-${slugId(moduleName)}-${String(index + 1).padStart(3, "0")}`,
        behaviorName: behavior.behaviorName,
        module: behavior.module,
        feature: behavior.feature,
        confidence: behavior.confidence,
        evidence: dedupeStrings(behavior.evidence).slice(0, 12),
        sourceBehaviorIds: behavior.sourceBehaviorIds ?? []
      });
    });
  }

  return behaviors;
}

function behaviorsFromDocs(module, docs) {
  const moduleDocs = docsForModule(docs, module);
  const drafts = [];

  for (const doc of moduleDocs.filter((item) => item.document === "BEHAVIOR.md")) {
    const ids = extractBehaviorIds(doc.text);
    for (const id of ids) {
      const line = lineFor(doc.lines, id);
      drafts.push({
        feature: module.feature,
        module: module.module,
        behaviorName: behaviorNameFromDocLine(line, id),
        confidence: "HIGH",
        evidence: [`behavior document id ${id}: ${doc.file}`],
        sourceBehaviorIds: [id]
      });
    }

    if (ids.length === 0 && !/placeholder/i.test(doc.text)) {
      const goalLine = doc.lines.find((lineText) => /lets|allows|can|should|must/i.test(lineText) && !lineText.startsWith("#"));
      if (goalLine) {
        drafts.push({
          feature: module.feature,
          module: module.module,
          behaviorName: titleFromSentence(goalLine),
          confidence: "MEDIUM",
          evidence: [`behavior goal text: ${doc.file}`]
        });
      }
    }
  }

  return drafts;
}

function behaviorsFromSource(module, sourceRecords) {
  const records = recordsForModule(sourceRecords, module);
  const drafts = [];

  for (const record of records) {
    if (record.layer !== "controller" && record.layer !== "hook") continue;
    for (const declaration of record.callSymbols.declarations ?? []) {
      const name = cleanBehaviorName(declaration.name);
      if (!name) continue;
      drafts.push({
        feature: module.feature,
        module: module.module,
        behaviorName: name,
        confidence: record.layer === "controller" ? "HIGH" : "MEDIUM",
        evidence: [`${record.layer} declaration ${declaration.name}: ${record.relative}`]
      });
    }
  }

  return drafts;
}

function behaviorsFromRoutes(module, routes) {
  return routes
    .filter((route) => route.appId === "VCSM" && route.feature === module.feature && moduleFromRoute(route.route, module.feature) === module.module)
    .map((route) => ({
      feature: module.feature,
      module: module.module,
      behaviorName: `Open ${titleFromToken(lastRouteToken(route.route) || module.module)}`,
      confidence: "MEDIUM",
      evidence: [`route behavior: ${route.route}`]
    }));
}

function behaviorsFromWrites(module, writeSurfaces) {
  return writeSurfaces
    .filter((write) => write.appId === "VCSM" && write.feature === module.feature && moduleFromSourcePath(write.file, module.feature) === module.module)
    .map((write) => ({
      feature: module.feature,
      module: module.module,
      behaviorName: `${titleFromToken(write.operation)} ${titleFromToken(write.table ?? write.rpc ?? write.functionName ?? "data")}`,
      confidence: "MEDIUM",
      evidence: [`write surface ${write.operation}: ${write.file}`]
    }));
}

function buildBehaviorSurfaceMap(behaviors, modules, sourceRecords, maps) {
  const behaviorSurfaces = behaviors.map((behavior) => {
    const module = modules.find((item) => item.feature === behavior.feature && item.module === behavior.module);
    const moduleRecords = recordsForModule(sourceRecords, module);
    const keywords = behaviorKeywords(behavior);
    const matched = moduleRecords.filter((record) => matchesBehavior(record.relative, keywords) || recordMatchesDeclaration(record, keywords));
    const records = matched.length ? matched : moduleRecords;
    const files = new Set(records.map((record) => record.relative));
    const routes = maps.routeMap.routes.filter((route) => route.appId === "VCSM" && route.feature === behavior.feature && moduleFromRoute(route.route, behavior.feature) === behavior.module);
    const screens = maps.screenMap.screens.filter((screen) => screen.appId === "VCSM" && screen.feature === behavior.feature && files.has(screen.file));
    const writes = maps.writeSurfaceMap.writeSurfaces.filter((write) => write.appId === "VCSM" && files.has(write.file));
    const rpcs = maps.rpcMap.rpcs.filter((rpc) => rpc.appId === "VCSM" && files.has(rpc.file));
    const edgeFunctions = maps.edgeFunctionMap.edgeFunctions.filter((edge) => edge.appId === "VCSM" && files.has(edge.file));
    const tests = maps.testMap.tests.filter((test) => test.appId === "VCSM" && (files.has(test.file) || moduleFromSourcePath(test.file, behavior.feature) === behavior.module));

    return {
      behaviorId: behavior.behaviorId,
      behaviorName: behavior.behaviorName,
      feature: behavior.feature,
      module: behavior.module,
      routes: routes.map(pickRoute),
      screens: screens.map(pickScreen),
      hooks: pickLayer(records, "hook"),
      controllers: pickLayer(records, "controller"),
      dals: pickLayer(records, "dal"),
      rpcs: rpcs.map((rpc) => ({ rpc: rpc.rpc, file: rpc.file, caller: rpc.caller })),
      edgeFunctions: edgeFunctions.map((edge) => ({ edgeFunction: edge.function ?? edge.functionName, file: edge.file, caller: edge.caller })),
      tables: dedupeStrings(writes.map((write) => [write.schema, write.table].filter(Boolean).join(".")).filter(Boolean)),
      writes: writes.map((write) => ({ operation: write.operation, schema: write.schema, table: write.table, rpc: write.rpc, file: write.file })),
      tests: tests.map((test) => test.file),
      confidence: matched.length ? "MEDIUM" : "LOW",
      evidence: matched.length ? ["behavior keywords matched source surface"] : ["module-level surface fallback; behavior-specific call path not fully resolved"]
    };
  });

  return { behaviorSurfaces };
}

function buildBehaviorDocumentMap(behaviors, docs) {
  return {
    documents: behaviors.map((behavior) => {
      const behaviorDocs = docsForModule(docs, behavior);
      const documents = behaviorDocs.map((doc) => ({
        document: doc.document,
        file: doc.file,
        coverage: docCoversBehavior(doc, behavior) ? "COMPLETE" : "PARTIAL"
      }));
      const present = new Set(behaviorDocs.map((doc) => doc.document));
      return {
        behaviorId: behavior.behaviorId,
        behaviorName: behavior.behaviorName,
        feature: behavior.feature,
        module: behavior.module,
        documents,
        coverage: coverageFromDocs(documents),
        missing: [...SUPPORTED_DOCS].filter((docName) => !present.has(docName))
      };
    })
  };
}

function buildOwnershipMap(behaviors, docs) {
  return {
    ownership: behaviors.map((behavior) => {
      const behaviorDocs = docsForModule(docs, behavior);
      return {
        behaviorId: behavior.behaviorId,
        feature: behavior.feature,
        module: behavior.module,
        featureOwner: extractOwner(behaviorDocs, "Feature Owner") ?? `VCSM:${behavior.feature}`,
        moduleOwner: extractOwner(behaviorDocs, "Module Owner") ?? `VCSM:${behavior.feature}/${behavior.module}`,
        codeOwner: extractOwner(behaviorDocs, "Code Owner") ?? `apps/VCSM/src/features/${behavior.feature}`,
        decisionOwner: extractOwner(behaviorDocs, "Decision Owner") ?? null,
        securityOwner: extractOwner(behaviorDocs, "Security Owner") ?? ownerFromSecurityDoc(behaviorDocs),
        dataOwner: extractOwner(behaviorDocs, "Data Owner") ?? null,
        documentationOwner: extractOwner(behaviorDocs, "Documentation Owner") ?? ownerFromDocs(behaviorDocs),
        confidence: behaviorDocs.length ? "MEDIUM" : "LOW",
        evidence: behaviorDocs.map((doc) => doc.file).slice(0, 8)
      };
    })
  };
}

function buildPolicyMap(behaviors, docs) {
  const policies = [];

  for (const behavior of behaviors) {
    const behaviorDocs = docsForModule(docs, behavior);
    for (const doc of behaviorDocs) {
      for (const policy of extractPoliciesFromDoc(doc, behavior)) {
        policies.push({
          policyId: `POL-${String(policies.length + 1).padStart(4, "0")}`,
          behaviorId: behavior.behaviorId,
          type: policy.type,
          severity: policy.severity,
          rule: policy.rule,
          sourceDocument: doc.file,
          confidence: policy.confidence,
          evidence: policy.evidence
        });
      }
    }
  }

  return { policies };
}

function buildCoverageMap(behaviors, surfaces, documents, ownership, policies) {
  return {
    coverage: behaviors.map((behavior) => {
      const surface = surfaces.find((item) => item.behaviorId === behavior.behaviorId);
      const doc = documents.find((item) => item.behaviorId === behavior.behaviorId);
      const owner = ownership.find((item) => item.behaviorId === behavior.behaviorId);
      const behaviorPolicies = policies.filter((policy) => policy.behaviorId === behavior.behaviorId);
      return {
        behaviorId: behavior.behaviorId,
        feature: behavior.feature,
        module: behavior.module,
        architectureCoverage: docStatus(doc, "ARCHITECTURE.md"),
        behaviorCoverage: docStatus(doc, "BEHAVIOR.md"),
        securityCoverage: docStatus(doc, "SECURITY.md"),
        ownershipCoverage: owner?.confidence === "LOW" ? "MISSING" : "PARTIAL",
        testCoverage: surface?.tests?.length ? "PARTIAL" : "MISSING",
        policyCoverage: behaviorPolicies.length ? "PARTIAL" : "MISSING",
        codeSurfaceCoverage: hasCodeSurface(surface) ? "PARTIAL" : "MISSING"
      };
    })
  };
}

function buildGovernanceGraph(behaviors, modules, surfaces, policies) {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  function node(id, type, data = {}) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push({ id, type, ...data });
  }

  for (const module of modules) {
    const featureId = `feature:${module.feature}`;
    const moduleId = `module:${module.feature}:${module.module}`;
    node(featureId, "Feature", { feature: module.feature });
    node(moduleId, "Module", { feature: module.feature, module: module.module, confidence: module.confidence });
    edges.push({ from: featureId, to: moduleId, type: "OWNS_MODULE" });
  }

  for (const behavior of behaviors) {
    const behaviorId = `behavior:${behavior.behaviorId}`;
    node(behaviorId, "Behavior", behavior);
    edges.push({ from: `module:${behavior.feature}:${behavior.module}`, to: behaviorId, type: "OWNS_BEHAVIOR" });

    for (const policy of policies.filter((item) => item.behaviorId === behavior.behaviorId)) {
      const policyNodeId = `policy:${policy.policyId}`;
      node(policyNodeId, "Policy", policy);
      edges.push({ from: behaviorId, to: policyNodeId, type: "GOVERNED_BY" });
    }

    const surface = surfaces.find((item) => item.behaviorId === behavior.behaviorId);
    for (const file of surfaceFiles(surface)) {
      const surfaceId = `surface:${file}`;
      node(surfaceId, "CodeSurface", { file });
      edges.push({ from: behaviorId, to: surfaceId, type: "MAPS_TO_CODE" });
    }
  }

  return { nodes, edges };
}

function addModule(moduleEvidence, entry) {
  const key = `${entry.feature}:${entry.module}`;
  const current = moduleEvidence.get(key) ?? {
    feature: entry.feature,
    module: entry.module,
    confidence: entry.confidence,
    evidence: []
  };
  current.confidence = maxConfidence(current.confidence, entry.confidence);
  current.evidence.push(...entry.evidence);
  moduleEvidence.set(key, current);
}

function finalizeModule(module) {
  return {
    feature: module.feature,
    module: module.module,
    confidence: module.confidence,
    evidence: dedupeStrings(module.evidence).slice(0, 12)
  };
}

function modulesToFeatures(modules, behaviors) {
  return [...new Set(modules.map((module) => module.feature))].sort().map((feature) => ({
    feature,
    modules: modules.filter((module) => module.feature === feature).map((module) => module.module).sort(),
    behaviorCount: behaviors.filter((behavior) => behavior.feature === feature).length
  }));
}

function attachCodeSurfaces(behaviors, surfaces) {
  const byBehavior = new Map(surfaces.map((surface) => [surface.behaviorId, surface]));
  return behaviors.map((behavior) => {
    const surface = byBehavior.get(behavior.behaviorId);
    return {
      ...behavior,
      codeSurfaces: surface ? {
        routes: surface.routes.length,
        screens: surface.screens.length,
        hooks: surface.hooks.length,
        controllers: surface.controllers.length,
        dals: surface.dals.length,
        rpcs: surface.rpcs.length,
        edgeFunctions: surface.edgeFunctions.length,
        tables: surface.tables.length,
        tests: surface.tests.length
      } : null
    };
  });
}

function recordsForModule(sourceRecords, module) {
  if (!module) return [];
  return sourceRecords.filter((record) => record.appId === "VCSM" && record.feature === module.feature && moduleFromSourcePath(record.relative, module.feature) === module.module);
}

function docsForModule(docs, module) {
  return docs.filter((doc) => doc.feature === module.feature && (doc.module === module.module || (!doc.module && module.module === module.feature)));
}

function moduleFromSourcePath(relative, feature) {
  const prefix = `apps/VCSM/src/features/${feature}/`;
  if (!relative.startsWith(prefix)) return feature;
  const segments = relative.slice(prefix.length).split("/");

  if (feature === "dashboard") {
    if (segments[0] === "vport" && segments[1] === "dashboard" && segments[2] === "cards" && segments[3]) return segments[3];
    if (segments[0] === "qrcode") return "qrcode";
    if (segments[0] === "flyerBuilder") return segments[1] === "designStudio" ? "designStudio" : "flyerBuilder";
    if (segments[0] === "vport") return "vport";
    if (segments[0] === "shared") return "shared";
  }

  const first = segments[0]?.replace(/\.[^.]+$/, "");
  if (!first || segments.length === 1 || LAYER_SEGMENTS.has(first)) return feature;
  return first;
}

function moduleFromRoute(route, feature) {
  const parts = route.split("/").filter(Boolean);
  const dashboardIndex = parts.indexOf("dashboard");
  if (feature === "dashboard" && dashboardIndex >= 0 && parts[dashboardIndex + 1]) return parts[dashboardIndex + 1];
  return feature;
}

function featureFromDocPath(relative) {
  return relative.match(/APPS\/VCSM\/features\/([^/]+)/)?.[1] ?? null;
}

function moduleFromDocPath(relative) {
  return relative.match(/APPS\/VCSM\/features\/[^/]+\/modules\/([^/]+)/)?.[1] ?? null;
}

function docCoverageType(document) {
  if (document === "ARCHITECTURE.md") return "architecture";
  if (document === "BEHAVIOR.md") return "behavior";
  if (document === "SECURITY.md") return "security";
  if (document === "CURRENT_STATUS.md") return "status";
  return "readme";
}

function extractBehaviorIds(text) {
  return [...new Set([...text.matchAll(/\bBEH-[A-Za-z0-9_-]+-\d{3,}\b/g)].map((match) => match[0]))];
}

function lineFor(lines, token) {
  return lines.find((line) => line.includes(token)) ?? token;
}

function behaviorNameFromDocLine(line, id) {
  const clean = line.replace(id, "").replace(/^[#\-\s:]+/, "").trim();
  return clean ? titleFromSentence(clean) : titleFromToken(id.split("-").slice(1, -1).join(" "));
}

function cleanBehaviorName(name) {
  if (!name || name.length < 3) return null;
  const cleaned = name
    .replace(/^use/, "")
    .replace(/Controller$/, "")
    .replace(/DAL$/, "")
    .replace(/^(handle|on)(?=[A-Z])/, "")
    .replace(/^(get|list|read|load|count|create|insert|update|delete|remove|mark|send|submit|confirm|cancel|set|save|ensure|assert|resolve|review|publish|probe)(?=[A-Z])/, (verb) => `${verb} `);
  if (!/[A-Z]|\s/.test(cleaned)) return null;
  return titleFromToken(cleaned);
}

function titleFromSentence(sentence) {
  return titleFromToken(sentence.replace(/[`*_:#|]/g, " ").replace(/\s+/g, " ").trim()).slice(0, 80);
}

function titleFromToken(token) {
  return String(token ?? "")
    .replace(/[-_./]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugId(value) {
  return String(value).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
}

function normalizeKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function behaviorKeywords(behavior) {
  return dedupeStrings([
    ...behavior.behaviorName.toLowerCase().split(/[^a-z0-9]+/).filter((part) => part.length > 3),
    behavior.module.toLowerCase()
  ]);
}

function matchesBehavior(value, keywords) {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function recordMatchesDeclaration(record, keywords) {
  return (record.callSymbols.declarations ?? []).some((declaration) => matchesBehavior(declaration.name, keywords));
}

function pickLayer(records, layer) {
  return records.filter((record) => record.layer === layer).map((record) => record.relative).sort();
}

function pickRoute(route) {
  return { route: route.route, file: route.file, access: route.access, screen: route.elementName ?? null };
}

function pickScreen(screen) {
  return { screen: screen.component, file: screen.file, routes: screen.routes, screenKind: screen.screenKind };
}

function docCoversBehavior(doc, behavior) {
  const haystack = doc.text.toLowerCase();
  return behavior.sourceBehaviorIds.some((id) => haystack.includes(id.toLowerCase()))
    || haystack.includes(behavior.module.toLowerCase())
    || behavior.behaviorName.toLowerCase().split(" ").filter((part) => part.length > 4).some((part) => haystack.includes(part));
}

function coverageFromDocs(documents) {
  if (!documents.length) return "MISSING";
  if (documents.some((doc) => doc.coverage === "COMPLETE")) return "PARTIAL";
  return "PARTIAL";
}

function extractOwner(docs, label) {
  const pattern = new RegExp(`${label}\\s*[:|]\\s*([^|\\n]+)`, "i");
  for (const doc of docs) {
    const match = doc.text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function ownerFromSecurityDoc(docs) {
  return docs.some((doc) => doc.document === "SECURITY.md") ? "Security governance document" : null;
}

function ownerFromDocs(docs) {
  return docs.length ? "Governance document set" : null;
}

function extractPoliciesFromDoc(doc, behavior) {
  const policies = [];
  const lines = doc.lines;
  let activeType = null;

  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/^#+\s*/, "").trim();
    const heading = POLICY_HEADINGS.find((item) => normalized.includes(item));
    if (heading) activeType = heading.replace(/\s+/g, "_").toUpperCase();

    const finding = line.match(/\|\s*([A-Z]+-[A-Z0-9-]+)\s*\|\s*([A-Z]+)\s*\|\s*([^|]+)/);
    if (finding) {
      policies.push({
        type: "SECURITY_FINDING",
        severity: finding[2],
        rule: `${finding[1]}: ${finding[3].trim()}`,
        confidence: "HIGH",
        evidence: [`finding table in ${doc.document}`]
      });
      continue;
    }

    const severity = SEVERITIES.find((item) => line.includes(item));
    const isRuleLine = /^[-*]\s+/.test(line) || /must|never|owner|security|invariant|reject|block/i.test(line);
    if ((activeType || severity) && isRuleLine && line.trim().length > 8) {
      policies.push({
        type: activeType ?? "GOVERNANCE_RULE",
        severity: severity ?? (doc.document === "SECURITY.md" ? "HIGH" : "MEDIUM"),
        rule: line.replace(/^[-*]\s+/, "").trim(),
        confidence: docCoversBehavior(doc, behavior) ? "MEDIUM" : "LOW",
        evidence: [`policy text in ${doc.document}`]
      });
    }
  }

  return policies.slice(0, 20);
}

function docStatus(documentEntry, docName) {
  if (!documentEntry) return "MISSING";
  const doc = documentEntry.documents.find((item) => item.document === docName);
  if (!doc) return "MISSING";
  return doc.coverage === "COMPLETE" ? "COMPLETE" : "PARTIAL";
}

function hasCodeSurface(surface) {
  return Boolean(surface && (surface.controllers.length || surface.dals.length || surface.hooks.length || surface.routes.length || surface.writes.length));
}

function surfaceFiles(surface) {
  if (!surface) return [];
  return dedupeStrings([
    ...surface.controllers,
    ...surface.dals,
    ...surface.hooks,
    ...surface.screens.map((screen) => screen.file),
    ...surface.routes.map((route) => route.file)
  ].filter(Boolean));
}

function lastRouteToken(route) {
  return route.split("/").filter(Boolean).at(-1);
}

function byFeatureModule(a, b) {
  return `${a.feature}:${a.module}`.localeCompare(`${b.feature}:${b.module}`);
}

function byFeatureModuleName(a, b) {
  return `${a.feature}:${a.module}:${a.behaviorName}`.localeCompare(`${b.feature}:${b.module}:${b.behaviorName}`);
}

function group(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

function maxConfidence(a, b) {
  const rank = { HIGH: 3, MEDIUM: 2, LOW: 1, BLOCKED: 0 };
  return rank[b] > rank[a] ? b : a;
}

function dedupeStrings(items) {
  return [...new Set(items.filter(Boolean))];
}
