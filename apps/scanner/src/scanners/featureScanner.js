import fs from "node:fs/promises";
import path from "node:path";
import { collectSourceFiles, pathExists, toPosix } from "../core/fs.js";
import { layerFromPath } from "../core/ownership.js";

const APP_NAMES = ["VCSM", "wentrex", "Traffic"];

export async function scanFeatures(config) {
  const entries = [];
  const sourceFiles = await collectSourceFiles(config);

  for (const app of APP_NAMES) {
    entries.push(...await scanAppFeatures(config, app, sourceFiles));
    entries.push(...await scanAppAreas(config, app, sourceFiles));
  }

  entries.push(...await scanEngines(config));
  entries.push(...await scanShared(config));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    root: config.repoRoot,
    features: entries.sort((a, b) => a.path.localeCompare(b.path))
  };
}

async function scanAppFeatures(config, app, sourceFiles) {
  const root = path.join(config.repoRoot, "apps", app, "src", "features");
  if (!(await pathExists(root))) return [];
  const names = await readDirectories(root);
  return names.map((name) => ({
    feature: name,
    app,
    appId: app,
    root: `apps/${app}`,
    kind: "feature",
    path: toPosix(path.relative(config.repoRoot, path.join(root, name))),
    sourceFileCount: countFiles(sourceFiles, `apps/${app}/src/features/${name}/`),
    layerCounts: countLayers(sourceFiles, `apps/${app}/src/features/${name}/`),
    tests: countTests(sourceFiles, `apps/${app}/src/features/${name}/`),
    status: "active"
  }));
}

async function scanAppAreas(config, app, sourceFiles) {
  const root = path.join(config.repoRoot, "apps", app, "src");
  if (!(await pathExists(root))) return [];
  const names = await readDirectories(root);
  const interesting = new Set(["app", "components", "services", "state", "store", "styles", "shared", "modules", "tabs"]);
  return names.filter((name) => interesting.has(name)).map((name) => ({
    feature: name,
    app,
    appId: app,
    root: `apps/${app}`,
    kind: classifyArea(name),
    path: toPosix(path.relative(config.repoRoot, path.join(root, name))),
    sourceFileCount: countFiles(sourceFiles, `apps/${app}/src/${name}/`),
    layerCounts: countLayers(sourceFiles, `apps/${app}/src/${name}/`),
    tests: countTests(sourceFiles, `apps/${app}/src/${name}/`),
    status: "active"
  }));
}

async function scanEngines(config) {
  const root = path.join(config.repoRoot, "engines");
  if (!(await pathExists(root))) return [];
  const names = await readDirectories(root);
  return names.map((name) => ({
    feature: name,
    app: null,
    appId: null,
    root: `engines/${name}`,
    kind: "engine",
    path: toPosix(path.relative(config.repoRoot, path.join(root, name))),
    status: "active"
  }));
}

async function scanShared(config) {
  const root = path.join(config.repoRoot, "shared");
  if (!(await pathExists(root))) return [];
  const names = await readDirectories(root);
  return names.map((name) => ({
    feature: name,
    app: null,
    appId: null,
    root: "shared",
    kind: "shared",
    path: toPosix(path.relative(config.repoRoot, path.join(root, name))),
    status: "active"
  }));
}

function countFiles(files, prefix) {
  return files.filter((file) => toPosix(path.relative(process.cwd(), file)).includes(prefix) || toPosix(file).includes(prefix)).length;
}

function countLayers(files, prefix) {
  return files.reduce((acc, file) => {
    const normalized = toPosix(file);
    if (!normalized.includes(prefix)) return acc;
    const layer = layerFromPath(normalized);
    acc[layer] = (acc[layer] ?? 0) + 1;
    return acc;
  }, {});
}

function countTests(files, prefix) {
  return files.filter((file) => {
    const normalized = toPosix(file);
    return normalized.includes(prefix) && (/\/__tests__\//.test(normalized) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(normalized));
  }).length;
}

async function readDirectories(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith(".")).map((entry) => entry.name);
}

function classifyArea(name) {
  if (name === "services") return "services";
  if (name === "state" || name === "store") return "state";
  if (name === "styles") return "styles";
  if (name === "shared") return "shared";
  if (name === "tabs") return "tabs";
  return "platform-area";
}
