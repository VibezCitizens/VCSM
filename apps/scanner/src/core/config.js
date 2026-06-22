import path from "node:path";

export function createScannerConfig(options = {}) {
  const scannerRoot = options.scannerRoot ?? path.resolve(process.cwd());
  const repoRoot = options.repoRoot ?? path.resolve(scannerRoot, "../..");

  return {
    scannerVersion: "1.1.0",
    scannerRoot,
    repoRoot,
    outputRoot: options.outputRoot ?? path.join(scannerRoot, "maps"),
    docsRoot: options.docsRoot ?? path.join(repoRoot, "ZZnotforproduction", "APPS", "VCSM"),
    scanRoots: options.scanRoots ?? [
      "apps/VCSM/src",
      "apps/VCSM/functions",
      "apps/VCSM/supabase/functions",
      "apps/wentrex/src",
      "apps/wentrex/supabase/functions",
      "apps/Traffic/src",
      "engines",
      "shared"
    ],
    ignoredDirs: new Set([
      ".git",
      ".next",
      "dist",
      "build",
      "coverage",
      "node_modules",
      "out"
    ]),
    sourceExtensions: new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]),
    testPatterns: [
      /(^|\/)__tests__\//,
      /(^|\/)tests?\//,
      /\.(test|spec)\.[cm]?[jt]sx?$/
    ]
  };
}
