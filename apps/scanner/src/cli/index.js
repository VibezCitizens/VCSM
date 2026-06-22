#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createScannerConfig } from "../core/config.js";
import { runScan } from "../core/runScan.js";
import { watchScan } from "../core/watchScan.js"; // watch spawns its own subprocesses; runScan is only used for the one-shot scan command

const scannerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (command !== "scan" && command !== "watch") {
    printHelp();
    process.exit(command ? 1 : 0);
  }

  const options = parseArgs(args);
  const config = createScannerConfig({
    scannerRoot,
    repoRoot: options.root ? path.resolve(options.root) : undefined,
    outputRoot: options.output ? path.resolve(options.output) : undefined,
    docsRoot: options.docs ? path.resolve(options.docs) : undefined
  });

  if (command === "watch") {
    watchScan(config);
    return;
  }

  const result = await runScan(config);
  console.log(`Scanner ${config.scannerVersion} complete`);
  console.log(`Source files scanned: ${result.sourceFileCount}`);
  console.log(`Maps written: ${result.outputRoot}`);
  console.log(`Import violations: ${result.violations ?? 0}`);
  console.log(`Missing adapter surfaces: ${result.missingAdapters ?? 0}`);

  if ((result.violations ?? 0) > 0 || (result.missingAdapters ?? 0) > 0) {
    console.error(`SCANNER FAIL — ${result.violations ?? 0} import violation(s), ${result.missingAdapters ?? 0} missing adapter(s). Fix before merge.`);
    process.exit(1);
  }
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--root") options.root = args[++index];
    if (arg === "--output") options.output = args[++index];
    if (arg === "--docs") options.docs = args[++index];
  }
  return options;
}

function printHelp() {
  console.log(`Usage:`);
  console.log(`  scanner scan  [--root /path/to/repo] [--output /path/to/maps] [--docs /path/to/docs-root]`);
  console.log(`  scanner watch [--root /path/to/repo] [--output /path/to/maps] [--docs /path/to/docs-root]`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
