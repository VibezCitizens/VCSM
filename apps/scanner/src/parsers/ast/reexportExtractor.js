import { walkAst } from "./parser.js";

/**
 * Extract all re-export statements from an AST.
 *
 * Handles four forms:
 *   export { X } from '...'           → named, kind: "named"
 *   export { X as Y } from '...'      → named with alias, kind: "named"
 *   export * from '...'               → wildcard, kind: "wildcard"
 *   export * as NS from '...'         → namespace, kind: "namespace"
 */
export function extractReexportsFromAst(ast) {
  if (!ast) return [];
  const reexports = [];

  walkAst(ast, (node) => {
    // export { X } from '...'  /  export { X as Y } from '...'
    if (node.type === "ExportNamedDeclaration" && node.source && node.specifiers?.length) {
      for (const specifier of node.specifiers) {
        const exportedName =
          specifier.exported?.name ?? specifier.exported?.value ?? null;
        const sourceName =
          specifier.local?.name ?? exportedName;
        if (exportedName) {
          reexports.push({
            exportedName,
            sourceName,
            fromPath: node.source.value,
            kind: "named",
          });
        }
      }
    }

    // export * from '...'  /  export * as NS from '...'
    if (node.type === "ExportAllDeclaration" && node.source) {
      reexports.push({
        exportedName: node.exported?.name ?? "*",
        sourceName: "*",
        fromPath: node.source.value,
        kind: node.exported ? "namespace" : "wildcard",
      });
    }
  });

  return reexports;
}
