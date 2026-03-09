#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import process from 'process';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const ARCH_DIR = path.join(ROOT, 'architecture');
const REPORT_MD = path.join(ARCH_DIR, 'vcsm-architecture-report.md');
const REPORT_JSON = path.join(ARCH_DIR, 'vcsm-architecture-report.json');

const LAYER_ORDER = [
  'dal',
  'model',
  'controller',
  'hooks',
  'components',
  'screens',
];

const FILE_SUFFIX_RULES = [
  { test: /\/dal\/.+$/, expect: /\.dal\.(js|jsx|ts|tsx)$/ },
  { test: /\/model\/.+$/, expect: /\.model\.(js|jsx|ts|tsx)$/ },
  { test: /\/controller\/.+$/, expect: /\.controller\.(js|jsx|ts|tsx)$/ },
  { test: /\/hooks\/.+$/, expect: /\/use[A-Z0-9].+\.(js|jsx|ts|tsx)$/ },
  { test: /\/adapters\/.+$/, expect: /\.adapter\.(js|jsx|ts|tsx)$/ },
  { test: /\/screens\/.+$/, expect: /(\.view\.(jsx|tsx)|ViewScreen\.(jsx|tsx)|Screen\.(jsx|tsx))$/ },
];

const FEATURE_INTERNAL_LAYERS = [
  'dal',
  'model',
  'controller',
  'hooks',
  'components',
  'screens',
  'adapters',
];

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

const SUPABASE_REGEX = /\bsupabase\b/;
const RELATIVE_IMPORT_REGEX = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
const IMPORT_REGEX =
  /(?:import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"])|(?:export\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"])/g;

const DOC_COMMENT_BLOCK_REGEX = /\/\*\*[\s\S]*?\*\//g;
const BLOCK_COMMENT_REGEX = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_REGEX = /^\s*\/\/.*$/gm;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function writeFileSafe(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function normalizeSlashes(p) {
  return p.replace(/\\/g, '/');
}

function toProjectRelative(absPath) {
  return normalizeSlashes(path.relative(ROOT, absPath));
}

function toAlias(absPath) {
  const rel = normalizeSlashes(path.relative(SRC_DIR, absPath));
  return `@/${rel}`;
}

function isCodeFile(filePath) {
  return EXTENSIONS.has(path.extname(filePath));
}

function walk(dir) {
  if (!fileExists(dir)) return [];
  const out = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'dist' ||
      entry.name === 'build' ||
      entry.name === '.next' ||
      entry.name === 'coverage' ||
      entry.name === 'architecture'
    ) {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && isCodeFile(full)) {
      out.push(full);
    }
  }

  return out;
}

function stripCommentsForLineCount(content) {
  return content
    .replace(DOC_COMMENT_BLOCK_REGEX, '')
    .replace(BLOCK_COMMENT_REGEX, '')
    .replace(LINE_COMMENT_REGEX, '');
}

function countEffectiveLines(content) {
  return stripCommentsForLineCount(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function getImports(content) {
  const imports = [];
  let match;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const source = match[1] || match[2];
    if (source) imports.push(source);
  }
  return imports;
}

function getFeatureNameFromPath(filePath) {
  const rel = normalizeSlashes(path.relative(SRC_DIR, filePath));
  const parts = rel.split('/');
  if (parts[0] === 'features' && parts[1]) return parts[1];
  return null;
}

function getLayerFromPath(filePath) {
  const rel = normalizeSlashes(path.relative(SRC_DIR, filePath));
  const parts = rel.split('/');
  const featureLayerIndex = parts[0] === 'features' ? 2 : -1;
  const sharedLikeIndex = ['shared', 'core'].includes(parts[0]) ? 1 : -1;

  if (featureLayerIndex >= 0 && parts[featureLayerIndex]) return parts[featureLayerIndex];
  if (sharedLikeIndex >= 0 && parts[sharedLikeIndex]) return parts[sharedLikeIndex];
  return null;
}

function resolveImport(fromFile, source) {
  if (!source.startsWith('.')) return null;

  const base = path.dirname(fromFile);
  const raw = path.resolve(base, source);
  const candidates = [
    raw,
    `${raw}.js`,
    `${raw}.jsx`,
    `${raw}.ts`,
    `${raw}.tsx`,
    `${raw}.mjs`,
    `${raw}.cjs`,
    path.join(raw, 'index.js'),
    path.join(raw, 'index.jsx'),
    path.join(raw, 'index.ts'),
    path.join(raw, 'index.tsx'),
  ];

  for (const candidate of candidates) {
    if (fileExists(candidate)) return candidate;
  }

  return raw;
}

function resolveAliasImport(source) {
  if (!source.startsWith('@/')) return null;

  const rel = source.replace(/^@\//, '');
  const raw = path.join(SRC_DIR, rel);
  const candidates = [
    raw,
    `${raw}.js`,
    `${raw}.jsx`,
    `${raw}.ts`,
    `${raw}.tsx`,
    `${raw}.mjs`,
    `${raw}.cjs`,
    path.join(raw, 'index.js'),
    path.join(raw, 'index.jsx'),
    path.join(raw, 'index.ts'),
    path.join(raw, 'index.tsx'),
  ];

  for (const candidate of candidates) {
    if (fileExists(candidate)) return candidate;
  }

  return raw;
}

function isInsideFeature(filePath) {
  const rel = normalizeSlashes(path.relative(SRC_DIR, filePath));
  return rel.startsWith('features/');
}

function getFeatureDepth(filePath) {
  const rel = normalizeSlashes(path.relative(SRC_DIR, filePath));
  const parts = rel.split('/');
  if (parts[0] !== 'features' || !parts[1]) return null;
  return Math.max(0, parts.length - 3);
}

function inferLayerRank(layer) {
  if (!layer) return -1;
  const idx = LAYER_ORDER.indexOf(layer);
  return idx;
}

function isViewScreen(filePath) {
  return /(\.view\.(jsx|tsx)|ViewScreen\.(jsx|tsx))$/.test(filePath);
}

function isFinalScreen(filePath) {
  return /Screen\.(jsx|tsx)$/.test(filePath) && !/ViewScreen\.(jsx|tsx)$/.test(filePath) && !/\.view\.(jsx|tsx)$/.test(filePath);
}

function classifyFile(filePath) {
  const normalized = normalizeSlashes(filePath);
  if (normalized.includes('/dal/')) return 'dal';
  if (normalized.includes('/model/')) return 'model';
  if (normalized.includes('/controller/')) return 'controller';
  if (normalized.includes('/hooks/')) return 'hooks';
  if (normalized.includes('/components/')) return 'components';
  if (normalized.includes('/screens/')) {
    if (isFinalScreen(normalized)) return 'final-screen';
    if (isViewScreen(normalized)) return 'view-screen';
    return 'screens';
  }
  if (normalized.includes('/adapters/')) return 'adapters';
  if (normalized.includes('/shared/')) return 'shared';
  if (normalized.includes('/core/')) return 'core';
  return 'unknown';
}

function makeViolation({
  rule,
  severity = 'error',
  file,
  message,
  fixable = false,
  fix = null,
  meta = {},
}) {
  return { rule, severity, file, message, fixable, fix, meta };
}

function replaceRelativeImportsWithAlias(filePath, content) {
  let changed = false;

  const updated = content.replace(RELATIVE_IMPORT_REGEX, (full, source) => {
    const resolved = resolveImport(filePath, source);
    if (!resolved) return full;

    if (!normalizeSlashes(resolved).startsWith(normalizeSlashes(SRC_DIR))) {
      return full;
    }

    const alias = toAlias(resolved);
    changed = true;
    return full.replace(source, alias);
  });

  return { changed, content: updated };
}

function checkImportPathRule(filePath, content, violations) {
  let match;
  while ((match = RELATIVE_IMPORT_REGEX.exec(content)) !== null) {
    const source = match[1];
    violations.push(
      makeViolation({
        rule: 'Import Path Rule',
        file: filePath,
        message: `Relative import is forbidden in new modules: ${source}`,
        fixable: true,
        fix: 'convert-relative-import-to-alias',
        meta: { source },
      }),
    );
  }
}

function checkFileNamingRule(filePath, violations) {
  const normalized = normalizeSlashes(filePath);
  for (const rule of FILE_SUFFIX_RULES) {
    if (rule.test.test(normalized) && !rule.expect.test(normalized)) {
      violations.push(
        makeViolation({
          rule: 'File Naming Rule',
          file: filePath,
          message: `File name does not match required naming convention.`,
        }),
      );
    }
  }
}

function checkFileSizeRule(filePath, content, violations) {
  const lines = countEffectiveLines(content);
  if (lines > 300) {
    violations.push(
      makeViolation({
        rule: 'File Size & Decomposition Rule',
        file: filePath,
        message: `File has ${lines} effective lines. Maximum allowed is 300.`,
      }),
    );
  } else if (lines >= 250) {
    violations.push(
      makeViolation({
        rule: 'File Size Review Warning',
        severity: 'warning',
        file: filePath,
        message: `File has ${lines} effective lines and should be reviewed for decomposition.`,
      }),
    );
  }
}

function checkFolderDepthRule(filePath, violations) {
  const depth = getFeatureDepth(filePath);
  if (depth !== null && depth > 3) {
    violations.push(
      makeViolation({
        rule: 'Maximum Folder Depth Rule',
        file: filePath,
        message: `Feature file depth is ${depth}. Maximum allowed is 3 below feature root.`,
      }),
    );
  }
}

function checkDALRules(filePath, content, imports, violations) {
  if (classifyFile(filePath) !== 'dal') return;

  if (/\.select\s*\(\s*['"`]\*['"`]\s*\)/.test(content)) {
    violations.push(
      makeViolation({
        rule: "DAL .select('*') Rule",
        file: filePath,
        message: `.select('*') is forbidden in DAL.`,
      }),
    );
  }

  const forbiddenImportHints = [
    '/model/',
    '/controller/',
    '/hooks/',
    '/components/',
    '/screens/',
    '/adapters/',
  ];

  for (const source of imports) {
    if (source === '@/lib/supabase' || source.includes('supabase')) continue;

    if (source.startsWith('@/')) {
      const normalized = normalizeSlashes(source);
      if (forbiddenImportHints.some((segment) => normalized.includes(segment))) {
        violations.push(
          makeViolation({
            rule: 'DAL Contract',
            file: filePath,
            message: `DAL must not import higher layers: ${source}`,
          }),
        );
      }
    }
  }

  if (!/supabase\.schema\(\s*['"`]vc['"`]\s*\)/.test(content)) {
    violations.push(
      makeViolation({
        rule: 'Locked DAL Style',
        severity: 'warning',
        file: filePath,
        message: `DAL should use supabase.schema('vc').`,
      }),
    );
  }
}

function checkControllerRules(filePath, content, imports, violations) {
  if (classifyFile(filePath) !== 'controller') return;

  if (SUPABASE_REGEX.test(content)) {
    violations.push(
      makeViolation({
        rule: 'Controller Contract',
        file: filePath,
        message: `Controller must not import or use Supabase directly.`,
      }),
    );
  }

  const externalImports = imports.filter((source) => {
    if (!source.startsWith('@/') && !source.startsWith('.')) return false;
    if (source.startsWith('@/shared/') || source.startsWith('@/core/')) return true;
    if (source.startsWith('@/features/')) return true;
    if (source.startsWith('.')) return true;
    return false;
  });

  if (externalImports.length > 5) {
    violations.push(
      makeViolation({
        rule: 'Controller Fan-Out Rule',
        file: filePath,
        message: `Controller imports ${externalImports.length} external modules. Maximum allowed is 5.`,
      }),
    );
  }

  const exportFnMatches =
    content.match(/export\s+(async\s+)?function\s+[A-Za-z0-9_]+/g) || [];
  const exportConstMatches =
    content.match(/export\s+const\s+[A-Za-z0-9_]+\s*=\s*(async\s*)?\(/g) || [];
  const exportedUseCases = exportFnMatches.length + exportConstMatches.length;

  if (exportedUseCases > 1) {
    violations.push(
      makeViolation({
        rule: 'Single Responsibility File Rule',
        severity: 'warning',
        file: filePath,
        message: `Controller appears to expose ${exportedUseCases} use-cases. Prefer one controller file per use-case.`,
      }),
    );
  }
}

function checkModelRules(filePath, content, violations) {
  if (classifyFile(filePath) !== 'model') return;

  if (SUPABASE_REGEX.test(content)) {
    violations.push(
      makeViolation({
        rule: 'Model Contract',
        file: filePath,
        message: `Model must not import or use Supabase.`,
      }),
    );
  }

  if (/\bfetch\s*\(|\baxios\b|\bXMLHttpRequest\b/.test(content)) {
    violations.push(
      makeViolation({
        rule: 'Model Contract',
        file: filePath,
        message: `Model must not perform I/O or network access.`,
      }),
    );
  }
}

function checkHookRules(filePath, content, imports, violations) {
  if (classifyFile(filePath) !== 'hooks') return;

  if (SUPABASE_REGEX.test(content)) {
    violations.push(
      makeViolation({
        rule: 'Hook Contract',
        file: filePath,
        message: `Hook must not import or use Supabase.`,
      }),
    );
  }

  for (const source of imports) {
    if (
      source.startsWith('@/features/') &&
      (source.includes('/dal/') || source.includes('/model/'))
    ) {
      violations.push(
        makeViolation({
          rule: 'Hook Contract',
          file: filePath,
          message: `Hook must not import DAL or Model directly: ${source}`,
        }),
      );
    }
  }
}

function checkComponentRules(filePath, content, imports, violations) {
  if (classifyFile(filePath) !== 'components') return;

  if (SUPABASE_REGEX.test(content)) {
    violations.push(
      makeViolation({
        rule: 'Component Contract',
        file: filePath,
        message: `Component must not import or use Supabase.`,
      }),
    );
  }

  for (const source of imports) {
    if (
      source.startsWith('@/features/') &&
      (source.includes('/dal/') || source.includes('/controller/'))
    ) {
      violations.push(
        makeViolation({
          rule: 'Component Contract',
          file: filePath,
          message: `Component must not import DAL or Controller directly: ${source}`,
        }),
      );
    }
  }
}

function checkViewScreenRules(filePath, content, imports, violations) {
  if (classifyFile(filePath) !== 'view-screen') return;

  if (SUPABASE_REGEX.test(content)) {
    violations.push(
      makeViolation({
        rule: 'View Screen Contract',
        file: filePath,
        message: `View Screen must not import or use Supabase.`,
      }),
    );
  }

  for (const source of imports) {
    if (
      source.startsWith('@/features/') &&
      (source.includes('/dal/') || source.includes('/controller/') || source.includes('/model/'))
    ) {
      violations.push(
        makeViolation({
          rule: 'View Screen Contract',
          file: filePath,
          message: `View Screen must not import DAL, Model, or Controller directly: ${source}`,
        }),
      );
    }
  }
}

function checkFinalScreenRules(filePath, content, imports, violations) {
  if (classifyFile(filePath) !== 'final-screen') return;

  if (SUPABASE_REGEX.test(content)) {
    violations.push(
      makeViolation({
        rule: 'Final Screen Contract',
        file: filePath,
        message: `Final Screen must not import or use Supabase.`,
      }),
    );
  }

  for (const source of imports) {
    if (
      source.startsWith('@/features/') &&
      (source.includes('/dal/') || source.includes('/model/') || source.includes('/controller/'))
    ) {
      violations.push(
        makeViolation({
          rule: 'Final Screen Contract',
          file: filePath,
          message: `Final Screen must not import DAL, Model, or Controller directly: ${source}`,
        }),
      );
    }
  }
}

function checkAdapterRules(filePath, content, imports, violations) {
  if (classifyFile(filePath) !== 'adapters') return;

  if (SUPABASE_REGEX.test(content)) {
    violations.push(
      makeViolation({
        rule: 'Adapter Contract',
        file: filePath,
        message: `Adapter must not import or use Supabase.`,
      }),
    );
  }

  for (const source of imports) {
    if (
      source.startsWith('@/features/') &&
      (source.includes('/dal/') || source.includes('/model/') || source.includes('/controller/'))
    ) {
      violations.push(
        makeViolation({
          rule: 'Adapter Contract',
          file: filePath,
          message: `Adapter must never export or depend on DAL, Model, or Controller internals: ${source}`,
        }),
      );
    }
  }

  const nonReexportLogic =
    /\bfunction\b|\bconst\b|\blet\b|\bif\b|\bfor\b|\bwhile\b|\buseEffect\b|\buseState\b/.test(content) &&
    !/^\s*export\s+\{?[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/m.test(content);

  if (nonReexportLogic) {
    violations.push(
      makeViolation({
        rule: 'Adapter Contract',
        severity: 'warning',
        file: filePath,
        message: `Adapter should remain thin and declarative. Non-re-export logic detected.`,
      }),
    );
  }
}

function checkCrossFeatureBoundary(filePath, imports, violations) {
  const currentFeature = getFeatureNameFromPath(filePath);
  if (!currentFeature) return;

  for (const source of imports) {
    if (!source.startsWith('@/features/')) continue;

    const sourceParts = source.replace(/^@\//, '').split('/');
    const importedFeature = sourceParts[1];
    if (!importedFeature || importedFeature === currentFeature) continue;

    if (!source.includes('/adapters/')) {
      violations.push(
        makeViolation({
          rule: 'Cross-Feature Boundary Rule',
          file: filePath,
          message: `Feature "${currentFeature}" imports "${importedFeature}" internals directly: ${source}`,
        }),
      );
    }

    if (
      classifyFile(filePath) === 'components' &&
      source.includes('/components/')
    ) {
      violations.push(
        makeViolation({
          rule: 'UI Ownership Rule',
          file: filePath,
          message: `Feature component must not import another feature's internal UI: ${source}`,
        }),
      );
    }
  }
}

function checkDependencyDirection(filePath, imports, violations) {
  const currentLayer = getLayerFromPath(filePath);
  if (!currentLayer || !LAYER_ORDER.includes(currentLayer)) return;

  const currentRank = inferLayerRank(currentLayer);

  for (const source of imports) {
    let importedLayer = null;

    if (source.startsWith('@/')) {
      const resolved = resolveAliasImport(source);
      if (!resolved) continue;
      importedLayer = getLayerFromPath(resolved);
    } else if (source.startsWith('.')) {
      const resolved = resolveImport(filePath, source);
      if (!resolved) continue;
      importedLayer = getLayerFromPath(resolved);
    } else {
      continue;
    }

    if (!importedLayer || !LAYER_ORDER.includes(importedLayer)) continue;

    const importedRank = inferLayerRank(importedLayer);

    if (importedRank > currentRank) {
      violations.push(
        makeViolation({
          rule: 'Dependency Direction Rule',
          file: filePath,
          message: `Layer "${currentLayer}" must not depend on higher layer "${importedLayer}".`,
        }),
      );
    }
  }
}

function checkBuildOrder(files, violations) {
  const featureState = new Map();

  for (const file of files) {
    const feature = getFeatureNameFromPath(file);
    if (!feature) continue;

    const layer = getLayerFromPath(file);
    if (!LAYER_ORDER.includes(layer)) continue;

    if (!featureState.has(feature)) featureState.set(feature, new Set());
    featureState.get(feature).add(layer);
  }

  for (const file of files) {
    const feature = getFeatureNameFromPath(file);
    if (!feature) continue;

    const layer = getLayerFromPath(file);
    if (!LAYER_ORDER.includes(layer)) continue;

    const requiredLowerLayers = LAYER_ORDER.slice(0, LAYER_ORDER.indexOf(layer));
    const existing = featureState.get(feature) || new Set();

    for (const lower of requiredLowerLayers) {
      if (!existing.has(lower)) {
        violations.push(
          makeViolation({
            rule: 'Module Build Order Rule',
            severity: 'warning',
            file,
            message: `Feature "${feature}" has layer "${layer}" without lower layer "${lower}" defined.`,
          }),
        );
      }
    }
  }
}

function checkSharedLayerRules(filePath, imports, violations) {
  const rel = normalizeSlashes(path.relative(SRC_DIR, filePath));
  if (!rel.startsWith('shared/')) return;

  for (const source of imports) {
    if (source.startsWith('@/features/')) {
      violations.push(
        makeViolation({
          rule: 'Shared Layer Contract',
          file: filePath,
          message: `Shared layer must not import feature modules: ${source}`,
        }),
      );
    }
  }
}

function autofixFile(filePath) {
  const original = readFileSafe(filePath);
  if (!original) return { changed: false, fixes: [] };

  let content = original;
  const applied = [];

  const importFix = replaceRelativeImportsWithAlias(filePath, content);
  if (importFix.changed) {
    content = importFix.content;
    applied.push('Converted relative imports to @/ aliases');
  }

  if (content !== original) {
    writeFileSafe(filePath, content);
    return { changed: true, fixes: applied };
  }

  return { changed: false, fixes: [] };
}

function audit(files) {
  const violations = [];

  for (const file of files) {
    const content = readFileSafe(file);
    const imports = getImports(content);

    checkImportPathRule(file, content, violations);
    checkFileNamingRule(file, violations);
    checkFileSizeRule(file, content, violations);
    checkFolderDepthRule(file, violations);

    checkDALRules(file, content, imports, violations);
    checkModelRules(file, content, violations);
    checkControllerRules(file, content, imports, violations);
    checkHookRules(file, content, imports, violations);
    checkComponentRules(file, content, imports, violations);
    checkViewScreenRules(file, content, imports, violations);
    checkFinalScreenRules(file, content, imports, violations);
    checkAdapterRules(file, content, imports, violations);
    checkCrossFeatureBoundary(file, imports, violations);
    checkDependencyDirection(file, imports, violations);
    checkSharedLayerRules(file, imports, violations);
  }

  checkBuildOrder(files, violations);

  return violations;
}

function summarizeByRule(violations) {
  const map = new Map();

  for (const v of violations) {
    const key = v.rule;
    map.set(key, (map.get(key) || 0) + 1);
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([rule, count]) => ({ rule, count }));
}

function renderMarkdownReport({
  mode,
  filesScanned,
  violations,
  fixedFiles,
  fixedActions,
}) {
  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');
  const grouped = summarizeByRule(violations);

  const lines = [];
  lines.push('# VCSM Architecture Audit Report');
  lines.push('');
  lines.push(`- Mode: ${mode}`);
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Project Root: \`${normalizeSlashes(ROOT)}\``);
  lines.push(`- Files Scanned: ${filesScanned}`);
  lines.push(`- Errors: ${errors.length}`);
  lines.push(`- Warnings: ${warnings.length}`);
  lines.push(`- Files Auto-Fixed: ${fixedFiles.length}`);
  lines.push('');

  if (fixedFiles.length) {
    lines.push('## Auto-Fixed');
    lines.push('');
    for (const item of fixedFiles) {
      lines.push(`- \`${toProjectRelative(item.file)}\``);
      for (const action of item.fixes) {
        lines.push(`  - ${action}`);
      }
    }
    lines.push('');
  }

  lines.push('## Rule Summary');
  lines.push('');
  if (!grouped.length) {
    lines.push('- No violations found.');
  } else {
    for (const item of grouped) {
      lines.push(`- ${item.rule}: ${item.count}`);
    }
  }
  lines.push('');

  lines.push('## Pending Fix List');
  lines.push('');
  if (!violations.length) {
    lines.push('- No pending fixes.');
    lines.push('');
    return lines.join('\n');
  }

  const sorted = [...violations].sort((a, b) => {
    const fa = toProjectRelative(a.file);
    const fb = toProjectRelative(b.file);
    return fa.localeCompare(fb) || a.rule.localeCompare(b.rule);
  });

  let currentFile = null;
  for (const v of sorted) {
    const rel = toProjectRelative(v.file);
    if (rel !== currentFile) {
      currentFile = rel;
      lines.push(`### \`${rel}\``);
      lines.push('');
    }
    lines.push(`- [${v.severity.toUpperCase()}] **${v.rule}** — ${v.message}`);
  }

  lines.push('');
  lines.push('## Suggested Manual Fix Order');
  lines.push('');
  lines.push('1. Fix import path violations');
  lines.push('2. Fix cross-feature imports');
  lines.push('3. Fix DAL / controller / screen contract violations');
  lines.push('4. Fix dependency direction violations');
  lines.push('5. Split oversized or multi-responsibility files');
  lines.push('6. Fix warnings after all errors are resolved');
  lines.push('');

  if (fixedActions.length) {
    lines.push('## Applied Autofix Actions');
    lines.push('');
    for (const action of fixedActions) {
      lines.push(`- ${action}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function writeReports({ mode, filesScanned, violations, fixedFiles, fixedActions }) {
  ensureDir(ARCH_DIR);

  const md = renderMarkdownReport({
    mode,
    filesScanned,
    violations,
    fixedFiles,
    fixedActions,
  });

  writeFileSafe(REPORT_MD, md);
  writeFileSafe(
    REPORT_JSON,
    JSON.stringify(
      {
        mode,
        generatedAt: new Date().toISOString(),
        root: normalizeSlashes(ROOT),
        filesScanned,
        errors: violations.filter((v) => v.severity === 'error').length,
        warnings: violations.filter((v) => v.severity === 'warning').length,
        fixedFiles: fixedFiles.map((x) => ({
          file: toProjectRelative(x.file),
          fixes: x.fixes,
        })),
        fixedActions,
        violations: violations.map((v) => ({
          ...v,
          file: toProjectRelative(v.file),
        })),
      },
      null,
      2,
    ),
  );
}

function main() {
  ensureDir(ARCH_DIR);

  const args = new Set(process.argv.slice(2));
  const doFix = args.has('--fix');

  const files = walk(SRC_DIR);
  const fixedFiles = [];
  const fixedActions = [];

  let initialViolations = audit(files);

  if (doFix) {
    const fixTargets = new Set(
      initialViolations.filter((v) => v.fixable).map((v) => v.file),
    );

    for (const file of fixTargets) {
      const result = autofixFile(file);
      if (result.changed) {
        fixedFiles.push({ file, fixes: result.fixes });
        for (const fix of result.fixes) {
          fixedActions.push(`${toProjectRelative(file)}: ${fix}`);
        }
      }
    }
  }

  const finalFiles = walk(SRC_DIR);
  const finalViolations = audit(finalFiles);

  writeReports({
    mode: doFix ? 'audit+autofix+reaudit' : 'audit-only',
    filesScanned: finalFiles.length,
    violations: finalViolations,
    fixedFiles,
    fixedActions,
  });

  console.log('');
  console.log('VCSM architecture audit complete.');
  console.log(`Report: ${REPORT_MD}`);
  console.log(`JSON:   ${REPORT_JSON}`);
  console.log(`Errors: ${finalViolations.filter((v) => v.severity === 'error').length}`);
  console.log(`Warnings: ${finalViolations.filter((v) => v.severity === 'warning').length}`);
  console.log(`Auto-fixed files: ${fixedFiles.length}`);
  console.log('');

  process.exit(finalViolations.some((v) => v.severity === 'error') ? 1 : 0);
}

main();