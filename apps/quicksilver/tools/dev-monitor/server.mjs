#!/usr/bin/env node
// dev-monitor server — apps/quicksilver/tools/dev-monitor/server.mjs
// DEV-ONLY. Streams authorized scanner/grep/npm command output to the Dev Monitor overlay.
// Port 7867 — localhost-only. Never runs destructive commands. Never runs in production.
//
// Start: npm run dev-monitor (from apps/quicksilver/)
// Overlay connects from: http://localhost:5173 (VCSM dev server)

import http from 'http'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const PORT = 7867
const ALLOWED_ORIGIN = 'http://localhost:5173'
const LOCALHOST_ADDRS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../')
const VCSM_APP = path.join(WORKSPACE_ROOT, 'apps/VCSM')
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'ZZnotforproduction/dev-monitor/reports')

// ─── Auto-scan config ─────────────────────────────────────────────────────────
// Route segment → feature directory under apps/VCSM/src/features/
const AUTO_SCAN_FEATURE_MAP = {
  // Feed / social
  feed:          'feed',
  explore:       'explore',
  discover:      'feed',
  home:          'feed',
  citizen:       'feed',
  posts:         'post',
  post:          'post',
  social:        'social',

  // Chat
  chat:          'chat',

  // Notifications
  notification:  'notifications',
  notifications: 'notifications',
  noti:          'notifications',

  // Identity / profiles
  identity:      'identity',
  profile:       'identity',
  profiles:      'identity',
  me:            'identity',
  settings:      'settings',
  onboarding:    'auth',
  welcome:       'auth',
  login:         'auth',
  register:      'auth',
  invite:        'invite',

  // Vport / actor
  vport:         'vport',
  actor:         'vport',
  vportdashboard:'vportDashboard',
  dashboard:     'vportDashboard',

  // Media / uploads
  upload:        'upload',
  media:         'media',

  // Commerce
  booking:       'booking',
  exchange:      'exchange',
  reviews:       'reviews',
  portfolio:     'portfolio',
  ads:           'ads',
  professional:  'professional',

  // Learning
  learning:      'learning',

  // Wanders
  wanders:       'wanders',

  // Misc
  moderation:    'moderation',
  void:          'void',
  join:          'join',
  legal:         'legal',
}

// Combined security + quality pattern run against the feature directory on nav
const AUTO_SCAN_PATTERN = [
  'console\\.log',
  "\\.select\\(['\"]\\*['\"]\\)",
  'service_role',
  'eval\\s*\\(',
  'dangerouslySetInnerHTML',
  "\\.update\\(|\\.delete\\(|\\.insert\\(",
  'params\\.[a-zA-Z]*(Id|_id)',
  'TODO|FIXME|HACK',
].join('|')

// ─── Command Registry ─────────────────────────────────────────────────────────
// Only safe, read-only or test commands are registered here.
// Never register: rm, git push, db push, drop, delete, reset, or any mutation.
const COMMANDS = {
  // grep: read-only source scans
  'grep:console-log': {
    label: 'grep: console.log occurrences',
    cmd: 'grep',
    args: ['-rn', 'console\\.log', '--include=*.js', '--include=*.jsx', '--include=*.ts', '--include=*.tsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'grep',
  },
  'grep:todo': {
    label: 'grep: TODO / FIXME / HACK',
    cmd: 'grep',
    args: ['-rEn', 'TODO|FIXME|HACK', '--include=*.js', '--include=*.jsx', '--include=*.ts', '--include=*.tsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'grep',
  },
  'grep:raw-uuid': {
    label: 'grep: raw UUIDs in route paths',
    cmd: 'grep',
    args: ['-rEn', '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src/app'],
    cwd: WORKSPACE_ROOT,
    category: 'grep',
  },
  'grep:arrow-in-ui': {
    label: 'grep: arrow symbols in UI copy',
    cmd: 'grep',
    args: ['-rEn', '[→←↑↓]', '--include=*.jsx', '--include=*.tsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'grep',
  },
  'grep:rls-bypass': {
    label: 'grep: potential RLS bypass (service_role)',
    cmd: 'grep',
    args: ['-rn', 'service_role', '--include=*.js', '--include=*.jsx', '--include=*.ts', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'grep',
  },
  'grep:direct-actor-id': {
    label: 'grep: direct actorId in URL params',
    cmd: 'grep',
    args: ['-rEn', 'params\\.actorId|params\\.actor_id|actorId.*route', '--include=*.jsx', '--include=*.js', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'grep',
  },
  'grep:migrations': {
    label: 'grep: migration files list',
    cmd: 'find',
    args: ['supabase/migrations', '-name', '*.sql', '-type', 'f'],
    cwd: WORKSPACE_ROOT,
    category: 'grep',
  },

  // npm: test / lint (read-only, non-destructive)
  'npm:lint': {
    label: 'npm: lint',
    cmd: 'npm',
    args: ['run', 'lint'],
    cwd: VCSM_APP,
    category: 'npm',
    timeout: 60000,
  },
  'npm:test': {
    label: 'npm: test:run',
    cmd: 'npm',
    args: ['run', 'test:run'],
    cwd: VCSM_APP,
    category: 'npm',
    timeout: 120000,
  },
  'npm:test-coverage': {
    label: 'npm: test:coverage',
    cmd: 'npm',
    args: ['run', 'test:coverage'],
    cwd: VCSM_APP,
    category: 'npm',
    timeout: 180000,
  },
  'npm:legal-check': {
    label: 'npm: legal:check-files',
    cmd: 'npm',
    args: ['run', 'legal:check-files'],
    cwd: VCSM_APP,
    category: 'npm',
    timeout: 30000,
  },

  // security: static grep-based surface scans — zero API cost, instant results
  'sec:select-star': {
    label: 'sec: select("*") in DAL files (banned)',
    cmd: 'grep',
    args: ['-rEn', '\\.select\\(["\']\\*["\']\\)', '--include=*.js', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:service-role': {
    label: 'sec: service_role references (RLS bypass risk)',
    cmd: 'grep',
    args: ['-rn', 'service_role', '--include=*.js', '--include=*.jsx', '--include=*.mjs', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:actor-id-in-params': {
    label: 'sec: actorId / actor_id in route params (IDOR surface)',
    cmd: 'grep',
    args: ['-rEn', 'params\\.actorId|params\\.actor_id|params\\[.actor', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:no-ownership-check': {
    label: 'sec: supabase writes missing actor_owners join',
    cmd: 'grep',
    args: ['-rEn', '\\.update\\(|\\.delete\\(|\\.insert\\(', '--include=*.js', 'apps/VCSM/src/features'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:hardcoded-secrets': {
    label: 'sec: hardcoded secrets / tokens in source',
    cmd: 'grep',
    args: ['-rEn', '(secret|token|password|api_key)\\s*[:=]\\s*["\'][a-zA-Z0-9_\\-]{16,}', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:open-redirect': {
    label: 'sec: open redirect patterns',
    cmd: 'grep',
    args: ['-rEn', 'window\\.location\\s*=|router\\.push.*\\?|navigate.*redirect', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:xss-dangerous': {
    label: 'sec: dangerouslySetInnerHTML (XSS)',
    cmd: 'grep',
    args: ['-rn', 'dangerouslySetInnerHTML', '--include=*.jsx', '--include=*.js', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:eval-usage': {
    label: 'sec: eval() in source (code injection)',
    cmd: 'grep',
    args: ['-rEn', '\\beval\\s*\\(', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:env-vars': {
    label: 'sec: VITE_ env vars exposed to client',
    cmd: 'grep',
    args: ['-rEn', 'import\\.meta\\.env\\.VITE_', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },
  'sec:auth-skip': {
    label: 'sec: auth skip / bypass patterns',
    cmd: 'grep',
    args: ['-rEin', 'skip.*auth|bypass.*auth|noAuth|skipAuth|unauthenticated.*true', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'security',
  },

  // ─── Blue Team: HAWKEYE — Endpoint & API contract surface ─────────────────
  'hawkeye:edge-files': {
    label: 'hawkeye: edge function / worker files (auth surface map)',
    cmd: 'find',
    args: ['cloudflare-worker-upload', 'functions', '-type', 'f', '-name', '*.js'],
    cwd: VCSM_APP,
    category: 'blue-hawkeye',
  },
  'hawkeye:webhook-sig': {
    label: 'hawkeye: webhook + signature verification patterns',
    cmd: 'grep',
    args: ['-rEin', 'webhook|x-hub-signature|stripe-signature|svix-signature', '--include=*.js', '--include=*.mjs', 'functions', 'cloudflare-worker-upload', 'server'],
    cwd: VCSM_APP,
    category: 'blue-hawkeye',
  },
  'hawkeye:cors-headers': {
    label: 'hawkeye: CORS headers in edge / worker files',
    cmd: 'grep',
    args: ['-rn', 'Access-Control', '--include=*.js', '--include=*.mjs', 'functions', 'cloudflare-worker-upload'],
    cwd: VCSM_APP,
    category: 'blue-hawkeye',
  },
  'hawkeye:missing-auth-header': {
    label: 'hawkeye: edge files missing Authorization check',
    cmd: 'grep',
    args: ['-rLi', 'authorization|auth', '--include=*.js', 'functions', 'cloudflare-worker-upload'],
    cwd: VCSM_APP,
    category: 'blue-hawkeye',
  },

  // ─── Blue Team: LOKI — Runtime observability surface ──────────────────────
  'loki:n-plus-one': {
    label: 'loki: await inside .map/.forEach (N+1 risk)',
    cmd: 'grep',
    args: ['-rEn', '\\.map\\(.*async|\\.forEach\\(.*async', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-loki',
  },
  'loki:no-monitoring': {
    label: 'loki: controller files missing captureVcsmError',
    cmd: 'grep',
    args: ['-rL', 'captureVcsmError', '--include=*.controller.js', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-loki',
  },
  'loki:all-awaits': {
    label: 'loki: all top-level awaits in controllers (serial read audit)',
    cmd: 'grep',
    args: ['-rEn', 'const .* = await ', '--include=*.controller.js', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-loki',
  },
  'loki:subscription-churn': {
    label: 'loki: realtime subscriptions (churn / polling audit)',
    cmd: 'grep',
    args: ['-rEn', '\\.channel\\(|\\.subscribe\\(|supabase.*on\\(', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-loki',
  },

  // ─── Blue Team: SPIDER-MAN — Test coverage surface ────────────────────────
  'spiderman:test-files': {
    label: 'spiderman: all test files (coverage inventory)',
    cmd: 'find',
    args: ['apps/VCSM/src', '-name', '*.test.js', '-o', '-name', '*.test.jsx'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-spiderman',
  },
  'spiderman:controller-files': {
    label: 'spiderman: all controller files (compare vs test count)',
    cmd: 'find',
    args: ['apps/VCSM/src', '-name', '*.controller.js'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-spiderman',
  },
  'spiderman:dal-files': {
    label: 'spiderman: all DAL files (untested write surfaces)',
    cmd: 'find',
    args: ['apps/VCSM/src', '-name', '*.dal.js'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-spiderman',
  },
  'spiderman:behavior-files': {
    label: 'spiderman: BEHAVIOR.md presence per feature',
    cmd: 'find',
    args: ['apps/VCSM/src/features', '-name', 'BEHAVIOR.md'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-spiderman',
  },
  'spiderman:feature-dirs': {
    label: 'spiderman: feature directory list (compare vs BEHAVIOR.md count)',
    cmd: 'find',
    args: ['apps/VCSM/src/features', '-maxdepth', '1', '-mindepth', '1', '-type', 'd'],
    cwd: WORKSPACE_ROOT,
    category: 'blue-spiderman',
  },

  // ─── Red Team: WANDA — Attack surface gaps ────────────────────────────────
  'wanda:adapter-bypass': {
    label: 'wanda: direct cross-feature imports (adapter bypass)',
    cmd: 'grep',
    args: ['-rEn', "from '.*features/[a-z-]+/(controller|model|dal|hooks)/", '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-wanda',
  },
  'wanda:unguarded-dal-writes': {
    label: 'wanda: .update()/.delete()/.insert() in DAL files',
    cmd: 'grep',
    args: ['-rEn', '\\.update\\(|\\.delete\\(|\\.insert\\(', '--include=*.dal.js', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-wanda',
  },
  'wanda:engine-in-screens': {
    label: 'wanda: engine imports directly in screens/routes (trust boundary)',
    cmd: 'grep',
    args: ['-rEn', "from '@identity'|from '@booking'|from '@media'|from '@hydration'|from '@notifications'", '--include=*.jsx', 'apps/VCSM/src/screens', 'apps/VCSM/src/app'],
    cwd: WORKSPACE_ROOT,
    category: 'red-wanda',
  },
  'wanda:route-surface': {
    label: 'wanda: all route definitions (unreviewed surface map)',
    cmd: 'grep',
    args: ['-rEn', 'path:.*["\']/', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src/app'],
    cwd: WORKSPACE_ROOT,
    category: 'red-wanda',
  },
  'wanda:rpc-calls': {
    label: 'wanda: all RPC calls (unreviewed entry points)',
    cmd: 'grep',
    args: ['-rEn', '\\.rpc\\(', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-wanda',
  },

  // ─── Red Team: HULK — Blast radius & privilege escalation ─────────────────
  'hulk:idor-params': {
    label: 'hulk: resource IDs from URL params (IDOR surface map)',
    cmd: 'grep',
    args: ['-rEn', 'params\\.[a-zA-Z]*(Id|_id)', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-hulk',
  },
  'hulk:client-role': {
    label: 'hulk: role / privilege from client input (escalation risk)',
    cmd: 'grep',
    args: ['-rEin', 'params\\.role|body\\.role|params\\.admin|body\\.permission|req\\.body.*kind', '--include=*.js', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-hulk',
  },
  'hulk:admin-surface': {
    label: 'hulk: admin / moderator privilege check patterns',
    cmd: 'grep',
    args: ['-rEin', 'isAdmin|isModerator|is_admin|is_moderator|role.*admin|admin.*role', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-hulk',
  },
  'hulk:uncaught-async': {
    label: 'hulk: async functions without try/catch (cascade risk)',
    cmd: 'grep',
    args: ['-rLn', 'try {', '--include=*.controller.js', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-hulk',
  },
  'hulk:booking-state': {
    label: 'hulk: booking state machine transitions (state manipulation)',
    cmd: 'grep',
    args: ['-rEn', 'PENDING|CONFIRMED|COMPLETED|CANCELLED', '--include=*.js', 'apps/VCSM/src/features/booking'],
    cwd: WORKSPACE_ROOT,
    category: 'red-hulk',
  },

  // ─── Red Team: MAGNETO — Dependency concentration & SPOF ──────────────────
  'magneto:identity-fanout': {
    label: 'magneto: @identity engine import concentration',
    cmd: 'grep',
    args: ['-rn', "from '@identity'", '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-magneto',
  },
  'magneto:viewer-actor-spof': {
    label: 'magneto: getViewerActorId usage (auth SPOF concentration)',
    cmd: 'grep',
    args: ['-rn', 'getViewerActorId', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-magneto',
  },
  'magneto:supabase-spof': {
    label: 'magneto: supabase client concentration (infra SPOF)',
    cmd: 'grep',
    args: ['-rn', 'supabaseClient', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-magneto',
  },
  'magneto:realm-resolver-spof': {
    label: 'magneto: resolvePublicRealmId concentration (realm SPOF)',
    cmd: 'grep',
    args: ['-rn', 'resolvePublicRealmId', '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-magneto',
  },
  'magneto:notification-fanout': {
    label: 'magneto: notification engine concentration',
    cmd: 'grep',
    args: ['-rn', "from '@notifications'|notificationEngine", '--include=*.js', '--include=*.jsx', 'apps/VCSM/src'],
    cwd: WORKSPACE_ROOT,
    category: 'red-magneto',
  },
}

// ─── SSE State ────────────────────────────────────────────────────────────────
const sseClients = new Set()
let activeProc = null
let activeCommandId = null

const SCAN_CATEGORIES = new Set([
  'grep', 'security',
  'blue-hawkeye', 'blue-loki', 'blue-spiderman',
  'red-wanda', 'red-hulk', 'red-magneto',
])

function buildReport({ label, commandId, category, code, rawOutput }) {
  const trimmed = rawOutput.trim()
  const matchCount = trimmed ? trimmed.split('\n').length : 0
  const isScan = SCAN_CATEGORIES.has(category) || !category

  let status
  if (isScan) {
    status = matchCount > 0
      ? `CAUGHT — ${matchCount} result${matchCount === 1 ? '' : 's'}`
      : `CLEAN — nothing found`
  } else {
    status = code === 0 ? `PASSED` : `FAILED (exit ${code})`
  }

  const header = [
    `# Dev Monitor Report`,
    `Command : ${label ?? commandId}`,
    `ID      : ${commandId}`,
    `Status  : ${status}`,
    `Matches : ${matchCount}`,
    `Exit    : ${code}`,
    `Date    : ${new Date().toISOString()}`,
    ``,
    `─────────────────────────────────────────`,
    ``,
  ].join('\n')

  return { content: header + rawOutput, status, matchCount }
}

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`
  for (const res of sseClients) {
    try { res.write(payload) } catch (_) { sseClients.delete(res) }
  }
}

// ─── Command Execution ────────────────────────────────────────────────────────
function runCommand(commandId) {
  const def = COMMANDS[commandId]
  if (!def) {
    broadcast({ type: 'error', message: `Unknown command: ${commandId}` })
    return
  }
  if (activeProc) {
    broadcast({ type: 'error', message: `Already running: ${activeCommandId}. Kill it first.` })
    return
  }

  activeCommandId = commandId
  broadcast({ type: 'start', commandId, label: def.label })

  const lines = []
  const proc = spawn(def.cmd, def.args, {
    cwd: def.cwd,
    shell: false,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  })
  activeProc = proc

  const timeoutMs = def.timeout ?? 60000
  const killTimer = setTimeout(() => {
    if (activeProc === proc) {
      proc.kill('SIGTERM')
      broadcast({ type: 'timeout', message: `Killed after ${timeoutMs}ms` })
    }
  }, timeoutMs)

  proc.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    lines.push(text)
    broadcast({ type: 'line', stream: 'stdout', text })
  })

  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    lines.push(text)
    broadcast({ type: 'line', stream: 'stderr', text })
  })

  proc.on('close', (code) => {
    clearTimeout(killTimer)
    activeProc = null
    activeCommandId = null

    let reportPath = null
    let status = null
    let matchCount = 0
    try {
      fs.mkdirSync(REPORTS_DIR, { recursive: true })
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
      const slug = commandId.replace(/:/g, '-')
      const filename = `${stamp}.${slug}.txt`
      reportPath = path.join(REPORTS_DIR, filename)
      const report = buildReport({ label: def.label, commandId, category: def.category, code, rawOutput: lines.join('') })
      fs.writeFileSync(reportPath, report.content)
      status = report.status
      matchCount = report.matchCount
    } catch (_) {}

    broadcast({ type: 'exit', code, reportPath, status, matchCount })
  })

  proc.on('error', (err) => {
    clearTimeout(killTimer)
    activeProc = null
    activeCommandId = null
    broadcast({ type: 'error', message: err.message })
  })
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const remoteAddr = req.socket.remoteAddress
  if (!LOCALHOST_ADDRS.has(remoteAddr)) {
    res.writeHead(403)
    res.end('403 Forbidden — dev-monitor is localhost-only')
    return
  }

  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors)
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/commands') {
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' })
    res.end(JSON.stringify(COMMANDS))
    return
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ running: activeProc !== null, commandId: activeCommandId }))
    return
  }

  if (req.method === 'GET' && req.url === '/events') {
    res.writeHead(200, {
      ...cors,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write(`data: ${JSON.stringify({ type: 'ready' })}\n\n`)
    if (activeProc) {
      res.write(`data: ${JSON.stringify({ type: 'resume', commandId: activeCommandId })}\n\n`)
    }
    sseClients.add(res)
    req.on('close', () => sseClients.delete(res))
    return
  }

  if (req.method === 'POST' && req.url === '/run') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { commandId } = JSON.parse(body)
        if (!commandId || typeof commandId !== 'string') throw new Error('commandId required')
        runCommand(commandId)
        res.writeHead(200, { ...cors, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400, { ...cors, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  if (req.method === 'POST' && req.url === '/kill') {
    if (activeProc) {
      activeProc.kill('SIGTERM')
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, killed: activeCommandId }))
    } else {
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, note: 'no active process' }))
    }
    return
  }

  if (req.method === 'POST' && req.url === '/auto-scan') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      try {
        const { feature } = JSON.parse(body)
        if (!feature || typeof feature !== 'string') throw new Error('feature required')

        if (activeProc) {
          res.writeHead(200, { ...cors, 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, reason: 'busy' }))
          return
        }

        const featureDir = AUTO_SCAN_FEATURE_MAP[feature.toLowerCase()] ?? null
        if (!featureDir) {
          res.writeHead(200, { ...cors, 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, reason: 'unknown-feature', feature }))
          return
        }

        const scanTarget = path.join(WORKSPACE_ROOT, 'apps/VCSM/src/features', featureDir)
        const label = `auto-scan: ${featureDir}`

        activeCommandId = `auto:${featureDir}`
        broadcast({ type: 'start', commandId: activeCommandId, label })

        const rawLines = []
        const proc = spawn('grep', ['-rEn', AUTO_SCAN_PATTERN, '--include=*.js', '--include=*.jsx', scanTarget], {
          shell: false,
          env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
        })
        activeProc = proc

        const killTimer = setTimeout(() => {
          if (activeProc === proc) proc.kill('SIGTERM')
        }, 15000)

        proc.stdout.on('data', (chunk) => {
          const text = chunk.toString()
          rawLines.push(text)
          broadcast({ type: 'line', stream: 'stdout', text })
        })
        proc.stderr.on('data', (chunk) => {
          const text = chunk.toString()
          rawLines.push(text)
          broadcast({ type: 'line', stream: 'stderr', text })
        })
        proc.on('close', (code) => {
          clearTimeout(killTimer)
          activeProc = null
          activeCommandId = null
          let reportPath = null
          let status = null
          let matchCount = 0
          try {
            fs.mkdirSync(REPORTS_DIR, { recursive: true })
            const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
            reportPath = path.join(REPORTS_DIR, `${stamp}.auto-${featureDir}.txt`)
            const report = buildReport({
              label: `auto-scan: ${featureDir}`,
              commandId: `auto:${featureDir}`,
              category: 'security',
              code,
              rawOutput: rawLines.join(''),
            })
            fs.writeFileSync(reportPath, report.content)
            status = report.status
            matchCount = report.matchCount
          } catch (_) {}
          broadcast({ type: 'exit', code, reportPath, status, matchCount })
        })
        proc.on('error', (err) => {
          clearTimeout(killTimer)
          activeProc = null
          activeCommandId = null
          broadcast({ type: 'error', message: err.message })
        })

        res.writeHead(200, { ...cors, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, feature, featureDir, scanTarget }))
      } catch (e) {
        res.writeHead(400, { ...cors, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  res.writeHead(404, cors)
  res.end('Not found')
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[dev-monitor] Ready on http://127.0.0.1:${PORT}`)
  console.log(`[dev-monitor] Workspace : ${WORKSPACE_ROOT}`)
  console.log(`[dev-monitor] Reports   : ${REPORTS_DIR}`)
  console.log(`[dev-monitor] Commands  : ${Object.keys(COMMANDS).length} registered`)
})
