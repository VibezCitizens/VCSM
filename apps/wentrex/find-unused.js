// tools/find-unused.esm.js
// Run: node tools/find-unused.esm.js [--entries src/main.jsx,src/App.jsx,src/routes.jsx] [--include src/**] [--ignore "src/**/__tests__/**,src/sw.js"] [--ext .js,.jsx,.ts,.tsx,.css]
// Notes: ESM, works in "type": "module" projects.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

const arg = (name, def = "") => {
  const i = process.argv.findIndex((a) => a === name);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return def;
};

const ENTRIES = (arg("--entries", "src/main.jsx,src/App.jsx"))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((p) => path.resolve(cwd, p));

const INCLUDE_GLOBS = (arg("--include", "src/**"))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const IGNORE_GLOBS = (arg("--ignore", ""))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const EXTS = new Set(
  (arg("--ext", ".js,.jsx,.ts,.tsx,.css"))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

const globToRegex = (g) => {
  // very small glob-to-regex: **, *, ?
  const esc = (s) => s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  let r = "^" + g.split("**").map(esc).join("(.+?)") + "$";
  r = r.replace(/\\\*/g, "[^/]*").replace(/\\\?/g, ".");
  return new RegExp(r);
};

const includeRes = INCLUDE_GLOBS.map(globToRegex);
const ignoreRes = IGNORE_GLOBS.map(globToRegex);
const isIncluded = (rel) =>
  includeRes.length === 0 || includeRes.some((re) => re.test(rel));
const isIgnored = (rel) => ignoreRes.some((re) => re.test(rel));

const visited = new Set();
const allFiles = [];
const maybeUsedByGlob = new Set();

function walkAll(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    const rel = path.relative(cwd, p).replace(/\\/g, "/");
    if (isIgnored(rel)) continue;
    if (st.isDirectory()) {
      walkAll(p);
    } else if (EXTS.has(path.extname(p)) && isIncluded(rel)) {
      allFiles.push(p);
    }
  }
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function resolveImport(fromFile, spec) {
  // bare imports not resolved (node_modules)
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), spec);

  const candidates = [
    base,
    base + ".js",
    base + ".jsx",
    base + ".ts",
    base + ".tsx",
    path.join(base, "index.js"),
    path.join(base, "index.jsx"),
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// capture: import x from 'a'; require('a'); import('a'); React.lazy(() => import('a'))
// capture Vite glob: import.meta.glob('src/features/**/*.jsx', { eager: false })
const RE_STATIC_OR_REQUIRE =
  /import\s+(?:[^'"]+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/g;
const RE_DYNAMIC_IMPORT = /import\(\s*["']([^"']+)["']\s*\)/g;
const RE_REACT_LAZY = /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']\s*\)\s*\)/g;
const RE_VITE_GLOB = /import\.meta\.glob\(\s*["']([^"']+)["']/g;

function parseRefs(code) {
  const specs = new Set();

  let m;
  while ((m = RE_STATIC_OR_REQUIRE.exec(code))) {
    const s = m[1] || m[2];
    if (s) specs.add(s);
  }
  while ((m = RE_DYNAMIC_IMPORT.exec(code))) {
    if (m[1]) specs.add(m[1]);
  }
  while ((m = RE_REACT_LAZY.exec(code))) {
    if (m[1]) specs.add(m[1]);
  }
  const globs = [];
  while ((m = RE_VITE_GLOB.exec(code))) {
    if (m[1]) globs.push(m[1]);
  }

  return { specs: [...specs], globs };
}

function resolveGlob(fromFile, pattern) {
  // convert to absolute glob rooted at fromFile dir
  const baseDir = path.dirname(fromFile);
  // support relative globs like './features/**/*.jsx'
  const absolutePattern = pattern.startsWith(".")
    ? path.resolve(baseDir, pattern)
    : path.resolve(cwd, pattern);
  const relGlob = path.relative(cwd, absolutePattern).replace(/\\/g, "/");
  const re = globToRegex(relGlob);
  for (const f of allFiles) {
    const rel = path
      .relative(cwd, f)
      .replace(/\\/g, "/");
    if (re.test(rel)) {
      maybeUsedByGlob.add(f);
    }
  }
}

function dfs(file) {
  if (!file || visited.has(file) || !fs.existsSync(file)) return;
  visited.add(file);
  const code = read(file);
  const { specs, globs } = parseRefs(code);

  // handle globs first
  for (const g of globs) resolveGlob(file, g);

  // resolve static/dynamic/lazy imports
  for (const spec of specs) {
    const resolved = resolveImport(file, spec);
    if (resolved) dfs(resolved);
  }
}

function run() {
  const srcDir = path.resolve(cwd, "src");
  walkAll(srcDir);

  const seeds = ENTRIES.filter((p) => fs.existsSync(p));
  if (seeds.length === 0) {
    console.error("No entry files found:", ENTRIES.join(", "));
    process.exit(2);
  }
  for (const e of seeds) dfs(e);

  const entrySet = new Set(seeds);
  const unused = [];
  const maybeUsed = [];

  for (const f of allFiles) {
    if (entrySet.has(f)) continue;
    if (visited.has(f)) continue;
    if (maybeUsedByGlob.has(f)) {
      maybeUsed.push(f);
    } else {
      unused.push(f);
    }
  }

  const rel = (p) => path.relative(cwd, p).replace(/\\/g, "/");

  console.log("--- Unused (safe candidates) ---");
  unused.sort().forEach((f) => console.log(rel(f)));
  console.log("\n--- Maybe-used (referenced by globs) ---");
  maybeUsed.sort().forEach((f) => console.log(rel(f)));
  console.log(
    `\nTotals: unused=${unused.length}, maybe=${maybeUsed.length}, all=${allFiles.length}`
  );
}

run();
