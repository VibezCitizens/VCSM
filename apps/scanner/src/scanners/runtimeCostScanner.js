import { surfaceFiles } from "./governanceUtils.js";

export function scanRuntimeCosts(sourceRecords, maps) {
  const recordsByFile = new Map(sourceRecords.map((record) => [record.relative, record]));
  const runtimeCosts = maps.behaviorSurfaceMap.behaviorSurfaces.map((surface) => {
    const files = surfaceFiles(surface);
    const records = files.map((file) => recordsByFile.get(file)).filter(Boolean);
    const source = records.map((record) => record.source).join("\n");
    const findings = [];
    const dbCallCount = (source.match(/\.from\(|\.rpc\(|functions\.invoke|supabase\./g) ?? []).length;
    const ownershipChecks = (source.match(/assert.*Own|Owns.*Actor|ownership|actor_owners/gi) ?? []).length;

    if (dbCallCount >= 3) findings.push(finding("SERIAL_DB_CALLS", "MEDIUM", `Static source contains ${dbCallCount} Supabase/RPC/edge calls`));
    if (ownershipChecks > 1) findings.push(finding("DUPLICATE_OWNERSHIP_CHECKS", "LOW", `Static source contains ${ownershipChecks} ownership checks`));
    if (/setInterval|setTimeout|poll|refetchInterval/i.test(source)) findings.push(finding("POLLING_LOOP", "MEDIUM", "Polling or interval-like behavior detected"));
    if (/bypassCache|skipCache|cache:\s*false|forceRefresh/i.test(source)) findings.push(finding("CACHE_BYPASS", "LOW", "Cache bypass or force refresh detected"));
    if (/useEffect[\s\S]{0,300}(fetch|load|refresh|controller)/i.test(source)) findings.push(finding("HIGH_FREQUENCY_EFFECT", "LOW", "Effect-driven data load inferred"));
    if (/catch\s*\(\s*[^)]*\s*\)\s*{\s*}/.test(source)) findings.push(finding("SILENT_CATCH_BLOCK", "MEDIUM", "Empty catch block found"));
    if (/async\s+function|=>\s*{[\s\S]*?\bawait\b/.test(source) && !/catch|finally/.test(source)) findings.push(finding("UNHANDLED_PROMISE_PATH", "LOW", "Async path inferred without local catch/finally"));

    return {
      behaviorId: surface.behaviorId,
      feature: surface.feature,
      module: surface.module,
      serialDbCalls: dbCallCount,
      ownershipCheckCount: ownershipChecks,
      findings,
      confidence: findings.length ? "INFERRED" : "LOW",
      evidence: files.slice(0, 8)
    };
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    runtimeCosts
  };
}

function finding(type, severity, message) {
  return {
    type,
    severity,
    confidence: "INFERRED",
    evidence: [message]
  };
}
