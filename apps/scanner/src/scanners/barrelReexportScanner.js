import { buildBarrelChain } from "../resolvers/barrelResolver.js";

/**
 * Generate reexport-map.json and symbol-resolution-map.json from the
 * barrel reexport index and the barrel resolutions collected during
 * the callgraph build pass.
 *
 * reexport-map:        flat list of every re-export edge in the codebase
 * symbol-resolution-map: per-consumer chains from import site → barrel → origin
 */
export function scanBarrelReexports(config, sourceRecords, reexportIndex, barrelResolutions) {
  const reexports = buildReexportMapEntries(reexportIndex);
  const resolutions = buildSymbolResolutions(sourceRecords, reexportIndex, barrelResolutions);

  return {
    reexportMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      reexports,
    },
    symbolResolutionMap: {
      version: 1,
      generatedAt: new Date().toISOString(),
      resolutions,
    },
  };
}

/**
 * Build the flat reexport edge list from the resolved index.
 * One entry per (sourceFile, exportedName) pair.
 */
function buildReexportMapEntries(reexportIndex) {
  const entries = [];

  for (const [sourceFile, fileMap] of reexportIndex) {
    for (const [key, entry] of fileMap) {
      if (key.startsWith("*:")) continue; // wildcard sentinels are internal

      entries.push({
        sourceFile,
        exportFile: entry.fromFile,
        symbol: key,
        alias: entry.fromSymbol !== key ? entry.fromSymbol : null,
        kind: entry.kind,
        confidence: "HIGH",
        evidence: ["named re-export detected via AST"],
      });
    }
  }

  return entries.sort((a, b) =>
    a.sourceFile !== b.sourceFile
      ? a.sourceFile.localeCompare(b.sourceFile)
      : a.symbol.localeCompare(b.symbol)
  );
}

/**
 * Build the full symbol resolution map.
 *
 * Sources:
 * 1. barrelResolutions collected during callgraph edge building (consumer called
 *    through a barrel).
 * 2. Any additional import-through-barrel that was not part of a tracked call
 *    (e.g. the barrel itself re-exports to another barrel).
 */
function buildSymbolResolutions(sourceRecords, reexportIndex, barrelResolutions) {
  const seen = new Set();
  const resolutions = [];

  // Callgraph-derived resolutions (highest quality — consumer is known)
  for (const resolution of barrelResolutions ?? []) {
    const key = `${resolution.consumer}:${resolution.importedSymbol}:${resolution.importedFrom}`;
    if (seen.has(key)) continue;
    seen.add(key);
    resolutions.push(resolution);
  }

  // Supplement: every import from a barrel file that resolves via the index
  // but wasn't captured by a call edge (e.g. imported but not directly called)
  for (const record of sourceRecords) {
    for (const imported of record.callSymbols.imports) {
      if (!imported.imported || imported.imported === "default" || imported.imported === "*") continue;

      const importedFile = resolveFileFromRecord(record, imported, reexportIndex);
      if (!importedFile) continue;

      if (!reexportIndex.has(importedFile)) continue; // not a barrel

      const { chain, origin } = buildBarrelChain(reexportIndex, importedFile, imported.imported);
      if (!origin || !chain.length) continue;

      const key = `${record.relative}:${imported.imported}:${importedFile}`;
      if (seen.has(key)) continue;
      seen.add(key);

      resolutions.push({
        consumer: record.relative,
        importedSymbol: imported.imported,
        importedFrom: importedFile,
        chain,
        origin,
        confidence: "MEDIUM",
        evidence: ["barrel import detected via AST; not confirmed by a call edge"],
      });
    }
  }

  return resolutions.sort((a, b) => a.consumer.localeCompare(b.consumer));
}

/**
 * Resolve an import record's importPath to a relative file using the
 * reexport index keys (which are already resolved paths).
 * This is a best-effort lookup — returns null when resolution is unavailable.
 */
function resolveFileFromRecord(record, imported, reexportIndex) {
  // The reexport index keys are relative paths already resolved by barrelResolver.
  // We can't re-resolve here without async findExistingPath, so we do a heuristic
  // match: check if any barrel file in the index was imported from this record.
  for (const barrelFile of reexportIndex.keys()) {
    // Heuristic: the barrel file path ends with the import path's last segment
    const importTail = imported.importPath.split("/").at(-1);
    if (barrelFile.endsWith(`/${importTail}.js`) || barrelFile.endsWith(`/${importTail}.jsx`)) {
      const fileMap = reexportIndex.get(barrelFile);
      if (fileMap?.has(imported.imported) || [...(fileMap?.keys() ?? [])].some((k) => k.startsWith("*:"))) {
        return barrelFile;
      }
    }
  }
  return null;
}
