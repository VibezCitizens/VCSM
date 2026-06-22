import { GOVERNANCE_DOCS, docsForBehavior, moduleFromSourcePath } from "./governanceUtils.js";

export function scanDocumentationDrift(sourceRecords, docs, maps) {
  const codeModules = new Set(sourceRecords.filter((record) => record.appId === "VCSM" && record.feature).map((record) => `${record.feature}:${moduleFromSourcePath(record.relative, record.feature)}`));
  const docModules = new Set(docs.filter((doc) => doc.feature).map((doc) => `${doc.feature}:${doc.module ?? doc.feature}`));
  const behaviorIds = new Set(maps.behaviorMap.behaviors.map((behavior) => behavior.behaviorId));
  const behaviorSurfacesById = new Map(maps.behaviorSurfaceMap.behaviorSurfaces.map((surface) => [surface.behaviorId, surface]));

  const drift = [];
  for (const key of codeModules) {
    if (!docModules.has(key)) drift.push(entry("CODE_WITHOUT_DOCS", key, "code module exists but governance docs are missing", "MEDIUM"));
  }
  for (const key of docModules) {
    if (!codeModules.has(key)) drift.push(entry("DOCS_WITHOUT_CODE", key, "governance docs exist but source module was not found", "LOW"));
  }

  for (const behavior of maps.behaviorMap.behaviors) {
    const surface = behaviorSurfacesById.get(behavior.behaviorId);
    if (!hasEnforcement(surface)) {
      drift.push({
        driftId: `DRIFT-${String(drift.length + 1).padStart(4, "0")}`,
        type: "BEHAVIOR_WITHOUT_ENFORCEMENT",
        feature: behavior.feature,
        module: behavior.module,
        behaviorId: behavior.behaviorId,
        severity: "HIGH",
        evidence: ["behavior declared but no controller/DAL/write/RPC/edge surface found"]
      });
    }
  }

  const behaviorDocs = new Map(maps.behaviorDocumentMap.documents.map((item) => [item.behaviorId, item]));
  for (const behavior of maps.behaviorMap.behaviors) {
    const doc = behaviorDocs.get(behavior.behaviorId);
    if (!doc?.documents.some((item) => item.document === "BEHAVIOR.md")) {
      drift.push({
        driftId: `DRIFT-${String(drift.length + 1).padStart(4, "0")}`,
        type: "ENFORCEMENT_WITHOUT_BEHAVIOR_DOC",
        feature: behavior.feature,
        module: behavior.module,
        behaviorId: behavior.behaviorId,
        severity: "MEDIUM",
        evidence: ["behavior inferred from code without BEHAVIOR.md coverage"]
      });
    }
  }

  for (const doc of docs.filter((item) => item.document === "CURRENT_STATUS.md" || item.document === "SECURITY.md")) {
    if (/complete|fixed/i.test(doc.text)) {
      const missing = [...GOVERNANCE_DOCS].filter((docName) => !docs.some((candidate) => candidate.feature === doc.feature && (candidate.module ?? candidate.feature) === (doc.module ?? doc.feature) && candidate.document === docName));
      if (missing.length) {
        drift.push({
          driftId: `DRIFT-${String(drift.length + 1).padStart(4, "0")}`,
          type: doc.document === "SECURITY.md" ? "SECURITY_FIXED_BUT_EVIDENCE_INCOMPLETE" : "STATUS_COMPLETE_BUT_REQUIRED_DOCS_MISSING",
          feature: doc.feature,
          module: doc.module ?? doc.feature,
          behaviorId: null,
          severity: "MEDIUM",
          evidence: [`${doc.file} claims complete/fixed; missing docs: ${missing.join(", ")}`]
        });
      }
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    drift,
    behaviorIds: [...behaviorIds]
  };
}

function entry(type, key, message, severity) {
  const [feature, module] = key.split(":");
  return {
    driftId: `${type}:${key}`,
    type,
    feature,
    module,
    behaviorId: null,
    severity,
    evidence: [message]
  };
}

function hasEnforcement(surface) {
  return Boolean(surface && (surface.controllers?.length || surface.dals?.length || surface.writes?.length || surface.rpcs?.length || surface.edgeFunctions?.length));
}
