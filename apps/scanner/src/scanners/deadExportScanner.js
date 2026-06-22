/**
 * Dead Export Scanner
 *
 * Detects exported symbols that have zero incoming CALLS edges anywhere
 * in the barrel-resolved callgraph.
 *
 * "Dead" means the symbol is exported but no other file in the codebase
 * calls it — directly or through any barrel chain.
 *
 * Does NOT flag:
 * - Test files
 * - Non-exported symbols
 * - Barrel virtual nodes (layer === "barrel")
 * - Module-level initialisation side-effects (no caller needed)
 */

const TEST_PATTERN = /(^|\/)(__tests__|tests?)\//;
const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/;

export function scanDeadExports(config, sourceRecords, callGraph) {
  const incomingCallCount = buildIncomingCallIndex(callGraph.edges);
  const barrelTargets = buildBarrelTargetSet(callGraph.edges);

  const deadExports = [];

  for (const node of callGraph.nodes) {
    if (!node.exported) continue;
    if (node.layer === "barrel") continue; // virtual relay nodes are never "dead"
    if (isTestFile(node.file)) continue;

    const consumerCount = incomingCallCount.get(node.id) ?? 0;
    const isBarrelTarget = barrelTargets.has(node.id);

    if (consumerCount === 0) {
      deadExports.push({
        symbol: node.name,
        id: node.id,
        file: node.file,
        layer: node.layer,
        owner: node.owner,
        consumerCount,
        isBarrelTarget,
        status: "UNUSED_EXPORT",
        confidence: "HIGH",
        evidence: ["no incoming CALLS edges from any consumer in barrel-resolved callgraph"],
      });
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    deadExports: deadExports.sort((a, b) =>
      a.file !== b.file ? a.file.localeCompare(b.file) : a.symbol.localeCompare(b.symbol)
    ),
  };
}

/**
 * Count incoming CALLS edges per target symbol id.
 */
function buildIncomingCallIndex(edges) {
  const index = new Map();
  for (const edge of edges) {
    if (edge.type !== "CALLS") continue;
    index.set(edge.to, (index.get(edge.to) ?? 0) + 1);
  }
  return index;
}

/**
 * Build the set of symbol ids that are targets of REEXPORTED_FROM edges.
 * Used to annotate dead exports that are re-exported (the barrel is live
 * but the ultimate consumer chain may still be broken).
 */
function buildBarrelTargetSet(edges) {
  const targets = new Set();
  for (const edge of edges) {
    if (edge.type === "REEXPORTED_FROM") targets.add(edge.to);
  }
  return targets;
}

function isTestFile(file) {
  return TEST_PATTERN.test(file) || TEST_FILE_PATTERN.test(file);
}
