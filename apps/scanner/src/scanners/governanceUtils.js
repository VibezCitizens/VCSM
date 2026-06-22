import fs from "node:fs/promises";
import path from "node:path";
import { pathExists, relativePath } from "../core/fs.js";

export const GOVERNANCE_DOCS = new Set(["ARCHITECTURE.md", "BEHAVIOR.md", "SECURITY.md", "CURRENT_STATUS.md", "README.md"]);
export const FINDING_STATUSES = new Set(["OPEN", "FIXED", "VERIFIED", "DEFERRED", "FALSE_POSITIVE", "ACCEPTED_RISK", "BLOCKED", "CLOSED"]);
export const SEVERITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO", "CAUTION", "BLOCKER"]);

export async function discoverGovernanceDocuments(config) {
  const docs = [];
  const root = config.docsRoot;
  if (!(await pathExists(root))) return docs;

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(next);
      } else if (GOVERNANCE_DOCS.has(entry.name) || (entry.name.endsWith(".md") && next.includes(`${path.sep}outputs${path.sep}`))) {
        const text = await fs.readFile(next, "utf8");
        const file = relativePath(config.repoRoot, next);
        docs.push({
          document: entry.name,
          file,
          feature: featureFromGovernancePath(file),
          module: moduleFromGovernancePath(file),
          text,
          lines: text.split(/\r?\n/)
        });
      }
    }
  }

  await walk(root);
  return docs.sort((a, b) => a.file.localeCompare(b.file));
}

export async function collectMigrationFiles(config) {
  const roots = [
    "apps/VCSM/supabase/migrations",
    "apps/wentrex/supabase/migrations",
    "supabase/migrations",
    "zzzzlegacy/CURRENT/platform/migrations"
  ];
  const files = [];

  for (const root of roots) {
    const absolute = path.join(config.repoRoot, root);
    if (!(await pathExists(absolute))) continue;
    await walkSql(config, absolute, files);
  }

  return Promise.all(files.sort().map(async (filePath) => ({
    file: relativePath(config.repoRoot, filePath),
    text: await fs.readFile(filePath, "utf8")
  })));
}

async function walkSql(config, current, files) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const next = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!config.ignoredDirs.has(entry.name)) await walkSql(config, next, files);
    } else if (entry.isFile() && /\.(sql|pgsql)$/i.test(entry.name)) {
      files.push(next);
    }
  }
}

export function featureFromGovernancePath(file) {
  return file.match(/APPS\/VCSM\/features\/([^/]+)/)?.[1] ?? null;
}

export function moduleFromGovernancePath(file) {
  return file.match(/APPS\/VCSM\/features\/[^/]+\/modules\/([^/]+)/)?.[1] ?? null;
}

export function moduleFromSourcePath(file, feature) {
  const prefix = `apps/VCSM/src/features/${feature}/`;
  if (!file?.startsWith(prefix)) return feature;
  const segments = file.slice(prefix.length).split("/");
  if (feature === "dashboard") {
    if (segments[0] === "vport" && segments[1] === "dashboard" && segments[2] === "cards" && segments[3]) return segments[3];
    if (segments[0] === "qrcode") return "qrcode";
    if (segments[0] === "flyerBuilder") return segments[1] === "designStudio" ? "designStudio" : "flyerBuilder";
    if (segments[0] === "vport") return "vport";
    if (segments[0] === "shared") return "shared";
  }
  return feature;
}

export function docsForBehavior(docs, behavior) {
  return docs.filter((doc) => doc.feature === behavior.feature && (doc.module === behavior.module || (!doc.module && behavior.module === behavior.feature)));
}

export function surfaceFiles(surface) {
  if (!surface) return [];
  return unique([
    ...(surface.controllers ?? []),
    ...(surface.dals ?? []),
    ...(surface.hooks ?? []),
    ...(surface.screens ?? []).map((screen) => screen.file),
    ...(surface.routes ?? []).map((route) => route.file),
    ...(surface.writes ?? []).map((write) => write.file)
  ].filter(Boolean));
}

export function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function statusFromText(text) {
  const upper = text.toUpperCase();
  if (upper.includes("FALSE POSITIVE")) return "FALSE_POSITIVE";
  if (upper.includes("ACCEPTED RISK")) return "ACCEPTED_RISK";
  for (const status of FINDING_STATUSES) {
    if (upper.includes(status)) return status;
  }
  return "OPEN";
}

export function severityFromText(text) {
  const upper = text.toUpperCase();
  for (const severity of SEVERITIES) {
    if (upper.includes(severity)) return severity;
  }
  return "MEDIUM";
}

export function normalizeId(value) {
  return String(value ?? "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
}
