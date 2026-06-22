import { surfaceFiles } from "./governanceUtils.js";

const SENSITIVE_IDS = [
  "userId",
  "user_id",
  "actorId",
  "actor_id",
  "callerActorId",
  "sessionActorId",
  "profileId",
  "vportId",
  "ownerUserId",
  "ownerActorId",
  "customerActorId",
  "documentId",
  "conversationId"
];

export function scanIdentityFlows(sourceRecords, maps) {
  const recordsByFile = new Map(sourceRecords.map((record) => [record.relative, record]));
  const writeFiles = new Set([
    ...maps.writeSurfaceMap.writeSurfaces.filter((item) => item.appId === "VCSM").map((item) => item.file),
    ...maps.rpcMap.rpcs.filter((item) => item.appId === "VCSM").map((item) => item.file),
    ...maps.edgeFunctionMap.edgeFunctions.filter((item) => item.appId === "VCSM").map((item) => item.file)
  ]);

  const identityFlows = sourceRecords
    .filter((record) => record.appId === "VCSM")
    .flatMap((record) => extractIdentityRefs(record, writeFiles));

  const riskFindings = identityFlows
    .filter((flow) => flow.reachesSensitiveSurface && flow.sourceClassification !== "SESSION_DERIVED" && !flow.ownershipAssertionFound)
    .map((flow, index) => ({
      findingId: `IDFLOW-${String(index + 1).padStart(4, "0")}`,
      idName: flow.idName,
      file: flow.file,
      feature: flow.feature,
      module: flow.module,
      risk: "CALLER_SUPPLIED_ID_WITHOUT_OWNERSHIP_ASSERTION",
      severity: flow.sourceClassification === "FORM_INPUT" || flow.sourceClassification === "PROP_SUPPLIED" ? "HIGH" : "MEDIUM",
      evidence: flow.evidence
    }));

  const behaviorIdentityFlows = maps.behaviorSurfaceMap.behaviorSurfaces.map((surface) => {
    const files = new Set(surfaceFiles(surface));
    return {
      behaviorId: surface.behaviorId,
      feature: surface.feature,
      module: surface.module,
      identityRefs: identityFlows.filter((flow) => files.has(flow.file)).map((flow) => flow.flowId),
      riskFindings: riskFindings.filter((finding) => files.has(finding.file)).map((finding) => finding.findingId)
    };
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    sensitiveIds: SENSITIVE_IDS,
    identityFlows,
    behaviorIdentityFlows,
    riskFindings,
    unresolvedRecordCount: [...writeFiles].filter((file) => !recordsByFile.has(file)).length
  };
}

function extractIdentityRefs(record, writeFiles) {
  const flows = [];
  for (const idName of SENSITIVE_IDS) {
    const pattern = new RegExp(`\\b${idName}\\b`, "g");
    const matches = [...record.source.matchAll(pattern)];
    for (const match of matches) {
      const context = contextAround(record.source, match.index);
      flows.push({
        flowId: `IDFLOW:${record.relative}:${idName}:${match.index}`,
        idName,
        file: record.relative,
        feature: record.feature,
        module: moduleFromRecord(record),
        layer: record.layer,
        sourceClassification: classifyIdentitySource(idName, context, record),
        reachesSensitiveSurface: writeFiles.has(record.relative),
        ownershipAssertionFound: /assert.*Own|Owns.*Actor|ownership|actor_owners|callerActorId.*actorId|requestActorId/s.test(record.source),
        evidence: [context.trim().replace(/\s+/g, " ").slice(0, 180)]
      });
    }
  }
  return flows;
}

function classifyIdentitySource(idName, context, record) {
  if (/useIdentity|session|auth\.getUser|sessionActorId/.test(context) || idName === "sessionActorId") return "SESSION_DERIVED";
  if (/params|useParams|route|match\.params/.test(context)) return "ROUTE_PARAM";
  if (/rpc\(|invoke\(|p_/.test(context)) return "RPC_PARAM";
  if (/form|input|payload|body|request\.json|FormData/.test(context)) return "FORM_INPUT";
  if (/props|function\s+\w+\([^)]*\b/.test(context)) return "PROP_SUPPLIED";
  if (record.layer === "dal" || /select\(|maybeSingle|from\(/.test(context)) return "DB_DERIVED";
  return "UNKNOWN";
}

function contextAround(source, index) {
  return source.slice(Math.max(0, index - 90), Math.min(source.length, index + 140));
}

function moduleFromRecord(record) {
  if (!record.feature) return null;
  if (record.feature === "dashboard") {
    const match = record.relative.match(/dashboard\/cards\/([^/]+)/);
    if (match) return match[1];
  }
  return record.feature;
}
