import path from "node:path";
import { relativePath } from "../core/fs.js";
import { classifyPath } from "../core/ownership.js";

export function scanTests(config, sourceRecords, featureMap) {
  const tests = sourceRecords
    .filter((record) => config.testPatterns.some((pattern) => pattern.test(record.relative)) || record.tests.length > 0)
    .map((record) => {
      const owner = classifyPath(record.relative);
      return {
        file: record.relative,
        owner: owner.owner,
        ownerKind: owner.kind,
        app: owner.app,
        appId: owner.appId,
        root: owner.root,
        feature: owner.feature,
        engine: owner.engine,
        declarations: record.tests,
        confidence: record.tests.length > 0 ? "HIGH" : "MEDIUM",
        evidence: record.tests.length > 0 ? ["test declarations extracted from AST"] : ["test file path matched"]
      };
    });

  const coveredOwners = new Set(tests.map((test) => test.owner));
  const missingTests = featureMap.features
    .filter((entry) => entry.kind === "feature" || entry.kind === "engine")
    .map((entry) => ownerForEntry(entry))
    .filter((owner) => !coveredOwners.has(owner))
    .map((owner) => ({ owner, status: "missing" }));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    tests: tests.sort((a, b) => a.file.localeCompare(b.file)),
    missingTests
  };
}

function ownerForEntry(entry) {
  if (entry.kind === "engine") return `engine:${entry.feature}`;
  return `${entry.app}:${entry.feature}`;
}
