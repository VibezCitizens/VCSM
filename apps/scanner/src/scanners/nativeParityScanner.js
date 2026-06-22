import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, relativePath } from "../core/fs.js";

export async function scanNativeParity(config, maps) {
  const nativeFiles = await collectNativeFiles(config);
  const nativeText = nativeFiles.map((file) => `${file.file}\n${file.text}`).join("\n").toLowerCase();
  const parity = maps.behaviorMap.behaviors.map((behavior) => {
    const tokens = [behavior.feature, behavior.module, ...behavior.behaviorName.toLowerCase().split(/\W+/).filter((token) => token.length > 4)];
    const matched = tokens.filter((token) => nativeText.includes(token.toLowerCase()));
    const status = nativeFiles.length === 0 ? "PARITY_UNKNOWN" : matched.length >= 2 ? "NATIVE_UNVERIFIED" : "NATIVE_MISSING";
    return {
      behaviorId: behavior.behaviorId,
      feature: behavior.feature,
      module: behavior.module,
      webImplementation: "VCSM_PWA",
      nativeImplementation: matched.length ? matched : [],
      parityStatus: status,
      evidence: matched.length ? [`native tokens matched: ${matched.slice(0, 6).join(", ")}`] : ["no native implementation evidence matched"]
    };
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    nativeRootsScanned: nativeFiles.map((file) => file.file),
    nativeParity: parity
  };
}

async function collectNativeFiles(config) {
  const roots = ["apps/VCSM/native", "apps/VCSM/ios", "apps/VCSM/android", "zzzzlegacy/CURRENT/platform/native"];
  const files = [];
  for (const root of roots) {
    const absolute = path.join(config.repoRoot, root);
    if (!(await pathExists(absolute))) continue;
    await walkNative(config, absolute, files);
  }
  return Promise.all(files.sort().map(async (filePath) => ({ file: relativePath(config.repoRoot, filePath), text: await fs.readFile(filePath, "utf8") })));
}

async function walkNative(config, current, files) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const next = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!config.ignoredDirs.has(entry.name)) await walkNative(config, next, files);
    } else if (/\.(swift|m|mm|kt|java|js|jsx|json|md)$/i.test(entry.name)) {
      files.push(next);
    }
  }
}
