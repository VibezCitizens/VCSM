import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, relativePath } from "../core/fs.js";
import { classifyPath, layerFromPath } from "../core/ownership.js";

export async function scanWriteSurfaces(config, sourceRecords) {
  const writeSurfaces = [];

  for (const record of sourceRecords) {
    const relative = record.relative;
    const owner = classifyPath(relative);

    for (const surface of record.writes.writes) {
      writeSurfaces.push({
        ...surface,
        owner: owner.owner,
        ownerKind: owner.kind,
        appId: owner.appId,
        root: owner.root,
        feature: owner.feature,
        layer: layerFromPath(relative),
        path: relative,
        file: relative
      });
    }
  }

  writeSurfaces.push(...await scanEdgeFunctionFiles(config));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    writeSurfaces: writeSurfaces.sort((a, b) => `${a.file}:${a.operation}`.localeCompare(`${b.file}:${b.operation}`))
  };
}

async function scanEdgeFunctionFiles(config) {
  const roots = [
    "apps/VCSM/functions",
    "apps/VCSM/supabase/functions",
    "apps/wentrex/supabase/functions"
  ];
  const files = [];

  for (const root of roots) {
    const absolute = path.join(config.repoRoot, root);
    if (!(await pathExists(absolute))) continue;
    await walkEdgeFiles(config, absolute, files);
  }

  return files.map((file) => {
    const relative = relativePath(config.repoRoot, file);
    return {
      operation: "edge_function_file",
      schema: null,
      table: null,
      rpc: null,
      functionName: edgeFunctionName(relative),
      confidence: "HIGH",
      evidence: ["edge function source file exists"],
      owner: classifyPath(relative).owner,
      appId: classifyPath(relative).appId,
      root: classifyPath(relative).root,
      feature: classifyPath(relative).feature,
      ownerKind: "edge-function",
      layer: "edge-function",
      path: relative,
      file: relative
    };
  });
}

async function walkEdgeFiles(config, current, files) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const next = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!config.ignoredDirs.has(entry.name)) await walkEdgeFiles(config, next, files);
    } else if (config.sourceExtensions.has(path.extname(entry.name))) {
      files.push(next);
    }
  }
}

function edgeFunctionName(relativePath) {
  const supabaseMatch = relativePath.match(/supabase\/functions\/([^/]+)/);
  if (supabaseMatch) return supabaseMatch[1];
  return relativePath.replace(/^apps\/[^/]+\/functions\//, "").replace(/\.[^.]+$/, "");
}
