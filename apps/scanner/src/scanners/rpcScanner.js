import { classifyPath } from "../core/ownership.js";

export function scanRpcs(sourceRecords) {
  const rpcs = [];

  for (const record of sourceRecords) {
    const owner = classifyPath(record.relative);
    for (const rpc of record.writes.rpcs) {
      rpcs.push({
        rpc: rpc.rpc,
        schema: rpc.schema,
        file: record.relative,
        appId: owner.appId,
        root: owner.root,
        feature: owner.feature,
        engine: owner.engine,
        caller: rpc.caller,
        confidence: rpc.confidence,
        evidence: rpc.evidence
      });
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    rpcs: rpcs.sort((a, b) => `${a.rpc}:${a.file}`.localeCompare(`${b.rpc}:${b.file}`))
  };
}
