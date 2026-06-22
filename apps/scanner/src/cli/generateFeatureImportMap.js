#!/usr/bin/env node
/**
 * Standalone runner for ARCH-IMPORTMAP-001.
 * Reads existing dependency-map.json and feature-map.json from apps/scanner/maps/
 * and generates FEATURE_IMPORT_MAP.json and FEATURE_IMPORT_MAP.md
 * into ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/.
 *
 * Run from repo root: node apps/scanner/src/cli/generateFeatureImportMap.js
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { scanFeatureImportMap } from "../scanners/featureImportMapScanner.js";
import { writeFeatureImportMap } from "../outputs/writeFeatureImportMap.js";

const scannerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = path.resolve(scannerRoot, "../..");
const mapsRoot = path.join(scannerRoot, "maps");
const docsRoot = path.join(repoRoot, "ZZnotforproduction", "APPS", "VCSM");

async function run() {
  const dependencyMapRaw = JSON.parse(
    await fs.readFile(path.join(mapsRoot, "dependency-map.json"), "utf8")
  );
  const featureMapRaw = JSON.parse(
    await fs.readFile(path.join(mapsRoot, "feature-map.json"), "utf8")
  );

  const dependencyMap = dependencyMapRaw.data;
  const featureMap = featureMapRaw.data;

  const featureImportMap = scanFeatureImportMap({ featureMap, dependencyMap });

  const config = { docsRoot };
  const { jsonPath, mdPath } = await writeFeatureImportMap(config, featureImportMap);

  console.log("ARCH-IMPORTMAP-001 — Feature Import Map generated");
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  MD:   ${mdPath}`);
  console.log(`  Features: ${featureImportMap.feature_count}`);
  console.log(`  Total violations: ${featureImportMap.total_violations}`);
  console.log(`  Bidirectional pairs: ${featureImportMap.bidir_pair_count}`);
  console.log(`  Split candidates: ${featureImportMap.split_candidates.join(", ")}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
