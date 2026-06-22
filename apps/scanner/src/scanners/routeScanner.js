import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, relativePath, toPosix } from "../core/fs.js";

export async function scanRoutes(config, sourceRecords) {
  const routes = [];

  for (const record of sourceRecords) {
    for (const route of record.routes) {
      routes.push({
        ...route,
        type: route.routeType,
        app: appFromPath(record.relative),
        appId: record.appId,
        root: record.root,
        feature: record.feature,
        path: record.relative,
        file: record.relative
      });
    }
  }

  routes.push(...await scanNextAppRoutes(config, "Traffic"));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    routes: dedupe(routes).sort((a, b) => `${a.app}:${a.route}:${a.file}`.localeCompare(`${b.app}:${b.route}:${b.file}`))
  };
}

async function scanNextAppRoutes(config, app) {
  const appRoot = path.join(config.repoRoot, "apps", app, "src", "app");
  if (!(await pathExists(appRoot))) return [];
  const files = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(next);
      } else if (/^(page|route)\.[jt]sx?$/.test(entry.name)) {
        files.push(next);
      }
    }
  }

  await walk(appRoot);

  return files.map((filePath) => {
    const relative = relativePath(config.repoRoot, filePath);
    const appRelative = toPosix(path.relative(appRoot, path.dirname(filePath)));
    const route = `/${appRelative === "" ? "" : appRelative}`
      .replace(/\/page$/, "")
      .replace(/\/route$/, "")
      .replace(/\/\([^)]+\)/g, "")
      .replace(/\/+/g, "/");
    return {
      route: route === "/" ? "/" : route.replace(/\/$/, ""),
      type: route.includes("[") ? "dynamic" : "static",
      routeType: route.includes("[") ? "dynamic" : "static",
      access: "public",
      routeAccess: "public",
      runtime: "web",
      confidence: "HIGH",
      evidence: ["Next app-router page or route file exists"],
      app,
      appId: app,
      root: `apps/${app}`,
      feature: featureFromNextPath(relative),
      path: relative,
      file: relative,
      source: "next-app-router"
    };
  });
}

function featureFromNextPath(relativePath) {
  const match = relativePath.match(/^apps\/[^/]+\/src\/features\/([^/]+)/);
  if (match) return match[1];
  if (relativePath.includes("/src/app/")) return "app";
  return null;
}

function appFromPath(relativePath) {
  return relativePath.match(/^apps\/([^/]+)\//)?.[1] ?? null;
}

function dedupe(routes) {
  const seen = new Set();
  return routes.filter((route) => {
    const key = `${route.app}:${route.route}:${route.file}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
