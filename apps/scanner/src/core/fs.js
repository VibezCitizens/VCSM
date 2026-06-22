import fs from "node:fs/promises";
import path from "node:path";

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function findExistingPath(targetPath, extensions = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]) {
  if (await pathExists(targetPath)) return targetPath;

  for (const extension of extensions) {
    if (await pathExists(`${targetPath}${extension}`)) return `${targetPath}${extension}`;
  }

  for (const extension of extensions) {
    const indexPath = path.join(targetPath, `index${extension}`);
    if (await pathExists(indexPath)) return indexPath;
  }

  return null;
}

export async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

export async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function relativePath(repoRoot, targetPath) {
  return toPosix(path.relative(repoRoot, targetPath));
}

export async function walkFiles(rootPath, config) {
  const files = [];

  async function walk(currentPath) {
    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
      const nextPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (!config.ignoredDirs.has(entry.name)) await walk(nextPath);
        continue;
      }
      if (entry.isFile() && config.sourceExtensions.has(path.extname(entry.name))) {
        files.push(nextPath);
      }
    }
  }

  await walk(rootPath);
  return files;
}

export async function collectSourceFiles(config) {
  const groups = await Promise.all(
    config.scanRoots.map(async (scanRoot) => {
      const absoluteRoot = path.join(config.repoRoot, scanRoot);
      if (!(await pathExists(absoluteRoot))) return [];
      return walkFiles(absoluteRoot, config);
    })
  );

  return groups.flat().sort();
}
