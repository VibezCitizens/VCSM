import { classifyPath } from "../core/ownership.js";

export function scanEdgeFunctions(sourceRecords, writeSurfaceMap) {
  const edgeFunctions = [];

  for (const surface of writeSurfaceMap.writeSurfaces.filter((item) => item.operation === "edge_function_file")) {
    edgeFunctions.push({
      function: surface.functionName,
      caller: null,
      appId: surface.appId,
      root: surface.root,
      feature: surface.feature,
      route: surface.file,
      file: surface.file,
      source: "edge-function-file",
      confidence: "HIGH",
      evidence: ["edge function file exists"]
    });
  }

  for (const record of sourceRecords) {
    const owner = classifyPath(record.relative);
    for (const edgeCall of record.writes.edgeCalls) {
      edgeFunctions.push({
        function: edgeCall.functionName,
        caller: edgeCall.caller,
        appId: owner.appId,
        root: owner.root,
        feature: owner.feature,
        engine: owner.engine,
        route: null,
        file: record.relative,
        source: edgeCall.operation === "edge_function" ? "supabase-invoke" : "fetch-mutation",
        confidence: edgeCall.confidence,
        evidence: edgeCall.evidence
      });
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    edgeFunctions: edgeFunctions.sort((a, b) => `${a.function}:${a.file}`.localeCompare(`${b.function}:${b.file}`))
  };
}
