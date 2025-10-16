// find-unused.js
// node find-unused.js
const fs = require('fs');
const path = require('path');

const SRC = path.join(process.cwd(), 'src');
const ENTRY_CANDIDATES = [
  path.join(SRC, 'main.jsx'),
  path.join(SRC, 'App.jsx'),
];

const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.css']);
const visited = new Set();
const allFiles = [];

function walkAll(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkAll(p);
    else if (exts.has(path.extname(p))) allFiles.push(p);
  }
}

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null; // ignore node_modules / bare imports
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base, base + '.js', base + '.jsx', base + '.ts', base + '.tsx',
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function parseImports(code) {
  const res = new Set();
  const re = /import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(code))) {
    const spec = m[1] || m[2];
    if (spec) res.add(spec);
  }
  return [...res];
}

function dfs(file) {
  if (!file || visited.has(file) || !fs.existsSync(file)) return;
  visited.add(file);
  const code = read(file);
  for (const spec of parseImports(code)) {
    const resolved = resolveImport(file, spec);
    if (resolved) dfs(resolved);
  }
}

// Build full file list
walkAll(SRC);

// Seed graph from entry points that exist
for (const e of ENTRY_CANDIDATES) if (fs.existsSync(e)) dfs(e);

// Show unreferenced files (excluding entry files themselves)
const entrySet = new Set(ENTRY_CANDIDATES.filter(fs.existsSync));
const unused = allFiles
  .filter(f => !visited.has(f) && !entrySet.has(f))
  .sort();

console.log('--- Unused files (from static import graph) ---');
unused.forEach(f => console.log(path.relative(process.cwd(), f)));
console.log('\nTotal:', unused.length);
