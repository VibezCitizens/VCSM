const path = require('path')
const fs = require('fs')

const REPO_ROOT = '/Users/vcsm/Desktop/VCSM'
const VCSM_ROOT = path.join(REPO_ROOT, 'apps/VCSM')
const VCSM_SRC  = path.join(VCSM_ROOT, 'src')
const ENGINES_ROOT = path.join(REPO_ROOT, 'engines')

// Exact-match engine aliases → resolved index file
const ENGINE_EXACT = {
  '@identity':      path.join(ENGINES_ROOT, 'identity/index.js'),
  '@hydration':     path.join(ENGINES_ROOT, 'hydration/index.js'),
  '@chat':          path.join(ENGINES_ROOT, 'chat/index.js'),
  '@reviews':       path.join(ENGINES_ROOT, 'reviews/index.js'),
  '@portfolio':     path.join(ENGINES_ROOT, 'portfolio/index.js'),
  '@booking':       path.join(ENGINES_ROOT, 'booking/index.js'),
  '@media':         path.join(ENGINES_ROOT, 'media/index.js'),
  '@notifications': path.join(VCSM_SRC, 'features/notifications/runtime/index.js'),
  '@i18n':          path.join(ENGINES_ROOT, 'i18n/index.js'),
}

// Prefix aliases → directory (trailing slash)
const ALIAS_PREFIXES = [
  { prefix: '@i18n/',      dir: path.join(ENGINES_ROOT, 'i18n'),                             kind: 'engine'   },
  { prefix: '@debuggers/', dir: path.join(REPO_ROOT, 'zNOTFORPRODUCTION/_ACTIVE/debuggers'), kind: 'debugger' },
  { prefix: '@/',          dir: VCSM_SRC,                                                     kind: 'internal' },
]

const EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs', '/index.js', '/index.jsx']

function tryResolve(base) {
  if (/\.(jsx?|mjs|cjs)$/.test(base) && fs.existsSync(base)) return base
  for (const ext of EXTENSIONS) {
    const candidate = base + ext
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function resolveImportPath(source, fromFile) {
  // Relative imports
  if (source.startsWith('.')) {
    const base = path.resolve(path.dirname(fromFile), source)
    const resolved = tryResolve(base)
    if (!resolved) return { kind: 'unresolved' }
    if (resolved.startsWith(VCSM_SRC)) return { kind: 'internal', path: resolved }
    return { kind: 'external-file', path: resolved }
  }

  // Exact engine aliases
  if (ENGINE_EXACT[source]) {
    const resolved = tryResolve(ENGINE_EXACT[source]) || ENGINE_EXACT[source]
    return { kind: 'engine', path: resolved, alias: source }
  }

  // Prefix aliases
  for (const { prefix, dir, kind } of ALIAS_PREFIXES) {
    if (source.startsWith(prefix)) {
      const rest = source.slice(prefix.length)
      const base = path.join(dir, rest)
      const resolved = tryResolve(base)
      if (!resolved) return { kind: 'unresolved' }
      if (kind === 'internal' && resolved.startsWith(VCSM_SRC)) return { kind: 'internal', path: resolved }
      return { kind, path: resolved, alias: prefix.slice(0, -1) }
    }
  }

  // External npm package
  return { kind: 'external', package: source }
}

module.exports = { resolveImportPath, VCSM_SRC, REPO_ROOT }
