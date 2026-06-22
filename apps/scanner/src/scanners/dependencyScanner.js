import path from "node:path";
import { findExistingPath, relativePath } from "../core/fs.js";
import { classifyPath } from "../core/ownership.js";
import { resolveImport } from "../parsers/imports.js";

export async function scanDependencies(config, sourceRecords) {
  const edges = new Map();

  for (const record of sourceRecords) {
    const filePath = record.filePath;
    const fromRelative = record.relative;
    const fromOwner = classifyPath(fromRelative);

    for (const importItem of record.imports) {
      const importPath = importItem.importPath;
      const resolved = resolveImport({ importerPath: filePath, importPath, repoRoot: config.repoRoot, aliases: config.aliases });
      if (!resolved) continue;
      const existingPath = await findExistingPath(resolved);
      const toRelative = relativePath(config.repoRoot, resolved);
      const toOwner = classifyPath(toRelative);
      if (!fromOwner.owner || !toOwner.owner || fromOwner.owner === toOwner.owner) continue;

      const key = `${fromOwner.owner}->${toOwner.owner}`;
      const current = edges.get(key) ?? {
        from: fromOwner.owner,
        fromKind: fromOwner.kind,
        fromAppId: fromOwner.appId,
        fromRoot: fromOwner.root,
        fromFeature: fromOwner.feature,
        to: toOwner.owner,
        toKind: toOwner.kind,
        toAppId: toOwner.appId,
        toRoot: toOwner.root,
        toFeature: toOwner.feature,
        relationship: relationshipFor(fromOwner, toOwner),
        confidence: existingPath ? "HIGH" : "MEDIUM",
        evidence: existingPath ? ["AST import resolved to source path"] : ["AST import resolved by alias or path heuristic"],
        imports: []
      };
      current.imports.push({
        file: fromRelative,
        appId: fromOwner.appId,
        root: fromOwner.root,
        feature: fromOwner.feature,
        importPath,
        importKind: importItem.kind,
        resolvedPath: stripExtensionProbe(path.posix.normalize(toRelative)),
        resolved: Boolean(existingPath)
      });
      edges.set(key, current);
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    dependencies: [...edges.values()].sort((a, b) => `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`))
  };
}

function relationshipFor(fromOwner, toOwner) {
  if (fromOwner.kind === "feature" && toOwner.kind === "feature") return "Feature->Feature";
  if (fromOwner.kind === "feature" && toOwner.kind === "engine") return "Feature->Engine";
  if (fromOwner.kind === "engine" && toOwner.kind === "engine") return "Engine->Engine";
  return `${fromOwner.kind}->${toOwner.kind}`;
}

function stripExtensionProbe(value) {
  return value.replace(/\/index$/, "");
}
