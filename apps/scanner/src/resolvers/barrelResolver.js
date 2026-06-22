import { findExistingPath, relativePath } from "../core/fs.js";
import { resolveImport } from "../parsers/imports.js";

const MAX_BARREL_DEPTH = 6;

/**
 * Build a reexport index from all source records.
 *
 * Returns: Map<relativeFile, Map<exportedName, { fromFile, fromSymbol, kind }>>
 *
 * Wildcard re-exports (export * from '...') are keyed as "*:<fromFile>" to
 * allow multiple wildcard sources per barrel without collision.
 */
export async function buildReexportIndex(config, sourceRecords) {
  const index = new Map();

  for (const record of sourceRecords) {
    if (!record.reexports?.length) continue;

    const fileMap = new Map();

    for (const reexport of record.reexports) {
      const resolved = resolveImport({
        importerPath: record.filePath,
        importPath: reexport.fromPath,
        repoRoot: config.repoRoot,
        aliases: config.aliases,
      });

      const existingPath = resolved ? await findExistingPath(resolved) : null;
      const fromFile = existingPath
        ? relativePath(config.repoRoot, existingPath)
        : null;

      if (!fromFile) continue;

      if (reexport.kind === "wildcard" || reexport.kind === "namespace") {
        // Wildcard: key on unique sentinel so multiple wildcards can coexist
        fileMap.set(`*:${fromFile}`, {
          fromFile,
          fromSymbol: "*",
          kind: reexport.kind,
        });
      } else {
        fileMap.set(reexport.exportedName, {
          fromFile,
          fromSymbol: reexport.sourceName ?? reexport.exportedName,
          kind: reexport.kind,
        });
      }
    }

    if (fileMap.size) index.set(record.relative, fileMap);
  }

  return index;
}

/**
 * Resolve a symbol through any number of barrel hops to its origin declaration.
 *
 * Returns: { file, symbolName, depth } or null if unresolvable.
 */
export function resolveOriginSymbol(reexportIndex, file, symbolName, depth = 0) {
  if (depth >= MAX_BARREL_DEPTH) return null;

  const fileMap = reexportIndex.get(file);
  if (!fileMap) return null;

  // Named re-export: export { X } from '...'
  const named = fileMap.get(symbolName);
  if (named) {
    const deeper = resolveOriginSymbol(
      reexportIndex,
      named.fromFile,
      named.fromSymbol,
      depth + 1
    );
    return deeper ?? { file: named.fromFile, symbolName: named.fromSymbol, depth: depth + 1 };
  }

  // Wildcard re-export: export * from '...'
  // Scan all wildcard sources in declaration order
  for (const [key, entry] of fileMap) {
    if (!key.startsWith("*:")) continue;
    const deeper = resolveOriginSymbol(
      reexportIndex,
      entry.fromFile,
      symbolName,
      depth + 1
    );
    if (deeper) return deeper;
  }

  return null;
}

/**
 * Build the full hop chain from a barrel file to the origin of a symbol.
 * Returns { chain: [{ file, symbol, hop }], origin: { file, symbolName } | null }
 */
export function buildBarrelChain(reexportIndex, startFile, symbolName) {
  const chain = [];
  let currentFile = startFile;
  let currentSymbol = symbolName;

  for (let depth = 0; depth < MAX_BARREL_DEPTH; depth++) {
    const fileMap = reexportIndex.get(currentFile);
    if (!fileMap) break;

    const named = fileMap.get(currentSymbol);
    if (named) {
      chain.push({ file: currentFile, symbol: currentSymbol, hop: depth + 1 });
      currentFile = named.fromFile;
      currentSymbol = named.fromSymbol;
    } else {
      // Check wildcards
      let foundWildcard = false;
      for (const [key, entry] of fileMap) {
        if (!key.startsWith("*:")) continue;
        const deeper = resolveOriginSymbol(reexportIndex, entry.fromFile, currentSymbol, depth + 1);
        if (deeper) {
          chain.push({ file: currentFile, symbol: "*", hop: depth + 1 });
          return { chain, origin: deeper };
        }
      }
      if (!foundWildcard) break;
    }
  }

  const origin = chain.length
    ? { file: currentFile, symbolName: currentSymbol }
    : null;

  return { chain, origin };
}
