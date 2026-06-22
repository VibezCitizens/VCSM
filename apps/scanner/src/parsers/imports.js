import path from "node:path";
import { toPosix } from "../core/fs.js";

const IMPORT_PATTERNS = [
  /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g,
  /export\s+[^'"]*\s+from\s+["']([^"']+)["']/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
  /require\(\s*["']([^"']+)["']\s*\)/g
];

export function parseImports(source) {
  const imports = [];
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      imports.push(match[1]);
    }
  }
  return [...new Set(imports)];
}

export function resolveImport({ importerPath, importPath, repoRoot, aliases }) {
  const appRoot = findAppRoot(importerPath, repoRoot);
  const aliasMatch = resolveAlias({ appRoot, importPath, repoRoot, aliases });
  if (aliasMatch) return aliasMatch;

  if (importPath.startsWith("@/")) {
    const appSourceRoot = findAppSourceRoot(importerPath, repoRoot);
    return appSourceRoot ? toPosix(path.join(appSourceRoot, importPath.slice(2))) : null;
  }

  if (importPath.startsWith("../") || importPath.startsWith("./")) {
    return toPosix(path.resolve(path.dirname(importerPath), importPath));
  }

  if (importPath.startsWith("engines/")) {
    return toPosix(path.join(repoRoot, importPath));
  }

  return null;
}

function findAppSourceRoot(filePath, repoRoot) {
  const relative = toPosix(path.relative(repoRoot, filePath));
  const match = relative.match(/^(apps\/[^/]+\/src)\//);
  return match ? path.join(repoRoot, match[1]) : null;
}

function findAppRoot(filePath, repoRoot) {
  const relative = toPosix(path.relative(repoRoot, filePath));
  return relative.match(/^(apps\/[^/]+)/)?.[1] ?? null;
}

function resolveAlias({ appRoot, importPath, repoRoot, aliases }) {
  if (!appRoot || !aliases?.has(appRoot)) return null;

  const entries = [...aliases.get(appRoot)].sort((a, b) => b.find.length - a.find.length);
  for (const entry of entries) {
    const target = resolveAliasEntry(entry, importPath, appRoot, repoRoot);
    if (target) return target;
  }

  return null;
}

function resolveAliasEntry(entry, importPath, appRoot, repoRoot) {
  const { find, replacement } = entry;
  if (find.endsWith("/*")) {
    const prefix = find.slice(0, -1);
    if (!importPath.startsWith(prefix)) return null;
    const suffix = importPath.slice(prefix.length);
    return resolveReplacement(replacement.replace(/\*/g, suffix), appRoot, repoRoot);
  }

  if (importPath === find) return resolveReplacement(replacement, appRoot, repoRoot);

  if (importPath.startsWith(`${find}/`)) {
    const suffix = importPath.slice(find.length + 1);
    return resolveReplacement(`${replacement.replace(/\/index\.js$/, "")}/${suffix}`, appRoot, repoRoot);
  }

  return null;
}

function resolveReplacement(replacement, appRoot, repoRoot) {
  if (replacement.startsWith("../../")) return toPosix(path.resolve(repoRoot, appRoot, replacement));
  if (replacement.startsWith("engines/")) return toPosix(path.join(repoRoot, replacement));
  if (replacement.startsWith("src/")) return toPosix(path.join(repoRoot, appRoot, replacement));
  return toPosix(path.resolve(repoRoot, appRoot, replacement));
}
