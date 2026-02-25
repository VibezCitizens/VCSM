#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../../..')

function parseArgs(argv) {
  const out = {}
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const [k, v] = raw.slice(2).split('=')
    out[k] = v === undefined ? true : v
  }
  return out
}

function toInt(v, fallback) {
  const n = Number.parseInt(String(v), 10)
  return Number.isFinite(n) ? n : fallback
}

function toFloat(v, fallback) {
  const n = Number.parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

function walk(dir, filelist = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, filelist)
    } else if (entry.isFile()) {
      filelist.push(full)
    }
  }
  return filelist
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const text = fs.readFileSync(filePath, 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const k = trimmed.slice(0, eq).trim()
    const v = trimmed.slice(eq + 1).trim()
    env[k] = v
  }
  return env
}

function normalizeRoute(route) {
  if (!route) return null
  if (route === '*') return null
  let p = route.trim()
  if (!p.startsWith('/')) p = `/${p}`
  p = p.replace(/\/:([^/]+)/g, '/sample-$1')
  p = p.replace(/\/+/g, '/')
  return p
}

function discoverRoutes() {
  const routesRoot = path.join(projectRoot, 'src', 'app', 'routes')
  if (!fs.existsSync(routesRoot)) return []

  const files = walk(routesRoot).filter((f) => /\.(js|jsx|ts|tsx)$/.test(f))
  const routeSet = new Set(['/'])
  const rx = /path:\s*['"`]([^'"`]+)['"`]/g

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    let m
    while ((m = rx.exec(text)) !== null) {
      const n = normalizeRoute(m[1])
      if (!n) continue
      routeSet.add(n)
    }
  }

  return Array.from(routeSet).sort((a, b) => a.localeCompare(b))
}

function randomInt(max) {
  return Math.floor(Math.random() * max)
}

function pickRandom(arr) {
  return arr[randomInt(arr.length)]
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

function summarizeDurations(values) {
  if (values.length === 0) {
    return { minMs: 0, maxMs: 0, avgMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0 }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const total = values.reduce((s, n) => s + n, 0)
  return {
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    avgMs: total / values.length,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
  }
}

async function timedFetch(url, options = {}, timeoutMs = 12000) {
  const started = performance.now()
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    const ended = performance.now()
    return {
      ok: res.ok,
      status: res.status,
      durationMs: ended - started,
      error: null,
    }
  } catch (error) {
    const ended = performance.now()
    return {
      ok: false,
      status: 0,
      durationMs: ended - started,
      error: error?.name || 'fetch_error',
    }
  } finally {
    clearTimeout(t)
  }
}

function createUserPlan({ baseUrl, routes, stepsPerUser, includeSupabase, supabaseUrl }) {
  const plan = [`${baseUrl}/`]
  for (let i = 0; i < stepsPerUser - 1; i += 1) {
    const route = pickRandom(routes)
    plan.push(`${baseUrl}${route}`)
  }
  if (includeSupabase && supabaseUrl) {
    plan.push(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/settings`)
  }
  return plan
}

async function run() {
  const args = parseArgs(process.argv.slice(2))
  const envFile = readEnvFile(path.join(projectRoot, '.env'))

  const users = toInt(args.users, 1000)
  const concurrency = toInt(args.concurrency, 120)
  const stepsPerUser = toInt(args.steps, 6)
  const timeoutMs = toInt(args.timeoutMs, 12000)
  const thinkTimeMinMs = toInt(args.thinkMinMs, 30)
  const thinkTimeMaxMs = toInt(args.thinkMaxMs, 140)
  const baseUrl = String(args.baseUrl || 'http://127.0.0.1:4173').replace(/\/+$/, '')
  const includeSupabase = String(args.includeSupabase ?? '1') === '1'
  const supabaseUrl = args.supabaseUrl || envFile.VITE_SUPABASE_URL || ''
  const anonKey = args.anonKey || envFile.VITE_SUPABASE_ANON_KEY || ''
  const failRateThreshold = toFloat(args.failRateThreshold, 0.05)
  const outDir = path.resolve(projectRoot, args.outDir || 'load-reports')

  const discoveredRoutes = discoverRoutes()
  const routes = discoveredRoutes.length ? discoveredRoutes : ['/', '/explore', '/chat', '/notifications']

  const stats = {
    runAt: new Date().toISOString(),
    config: {
      users,
      concurrency,
      stepsPerUser,
      timeoutMs,
      thinkTimeMinMs,
      thinkTimeMaxMs,
      baseUrl,
      includeSupabase,
      routeCount: routes.length,
      failRateThreshold,
    },
    totals: {
      requests: 0,
      successes: 0,
      failures: 0,
      byStatus: {},
      byError: {},
    },
    endpoints: {},
    userSummary: {
      completed: 0,
      failed: 0,
    },
  }

  let nextUserId = 1
  const startedAt = performance.now()

  function record(url, result) {
    const key = new URL(url).pathname || '/'
    if (!stats.endpoints[key]) {
      stats.endpoints[key] = {
        requests: 0,
        successes: 0,
        failures: 0,
        statuses: {},
        errors: {},
        durationsMs: [],
      }
    }
    const ep = stats.endpoints[key]

    stats.totals.requests += 1
    ep.requests += 1
    ep.durationsMs.push(result.durationMs)

    const code = String(result.status || 0)
    stats.totals.byStatus[code] = (stats.totals.byStatus[code] || 0) + 1
    ep.statuses[code] = (ep.statuses[code] || 0) + 1

    if (result.ok) {
      stats.totals.successes += 1
      ep.successes += 1
    } else {
      stats.totals.failures += 1
      ep.failures += 1
      const err = result.error || `http_${result.status || 0}`
      stats.totals.byError[err] = (stats.totals.byError[err] || 0) + 1
      ep.errors[err] = (ep.errors[err] || 0) + 1
    }
  }

  async function runUser(userId) {
    const plan = createUserPlan({
      baseUrl,
      routes,
      stepsPerUser,
      includeSupabase,
      supabaseUrl,
    })

    let userFailed = false
    for (const url of plan) {
      const isSupabase = supabaseUrl && url.startsWith(supabaseUrl)
      const headers = isSupabase
        ? {
            apikey: anonKey,
            authorization: `Bearer ${anonKey}`,
            'content-type': 'application/json',
            'cache-control': 'no-cache',
          }
        : {
            'cache-control': 'no-cache',
            'x-sim-user': `u-${userId}`,
          }

      const result = await timedFetch(url, { method: 'GET', headers }, timeoutMs)
      record(url, result)
      if (!result.ok) userFailed = true

      const think = thinkTimeMinMs + randomInt(Math.max(1, thinkTimeMaxMs - thinkTimeMinMs + 1))
      await new Promise((r) => setTimeout(r, think))
    }

    if (userFailed) stats.userSummary.failed += 1
    else stats.userSummary.completed += 1
  }

  async function workerLoop() {
    for (;;) {
      const userId = nextUserId
      nextUserId += 1
      if (userId > users) return
      await runUser(userId)
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => workerLoop())
  await Promise.all(workers)

  const endedAt = performance.now()
  const durationSec = (endedAt - startedAt) / 1000
  const allDurations = Object.values(stats.endpoints).flatMap((ep) => ep.durationsMs)
  const latency = summarizeDurations(allDurations)

  const endpointSummary = Object.entries(stats.endpoints)
    .map(([key, ep]) => {
      const d = summarizeDurations(ep.durationsMs)
      return {
        endpoint: key,
        requests: ep.requests,
        successes: ep.successes,
        failures: ep.failures,
        ...d,
      }
    })
    .sort((a, b) => b.requests - a.requests)

  const failRate = stats.totals.requests ? stats.totals.failures / stats.totals.requests : 0

  const report = {
    ...stats,
    totals: {
      ...stats.totals,
      failRate,
      durationSec,
      throughputRps: stats.totals.requests / Math.max(durationSec, 0.001),
    },
    latency,
    endpointSummary,
  }

  for (const ep of Object.values(report.endpoints)) {
    delete ep.durationsMs
  }

  fs.mkdirSync(outDir, { recursive: true })
  const stamp = new Date().toISOString().replaceAll(':', '-')
  const outPath = path.join(outDir, `load-sim-${users}u-${stamp}.json`)
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')

  console.log(`\nLoad simulation finished`)
  console.log(`users=${users} concurrency=${concurrency} routes=${routes.length}`)
  console.log(`requests=${report.totals.requests} failures=${report.totals.failures} failRate=${(failRate * 100).toFixed(2)}%`)
  console.log(
    `latency p50=${latency.p50Ms.toFixed(1)}ms p95=${latency.p95Ms.toFixed(1)}ms p99=${latency.p99Ms.toFixed(1)}ms`
  )
  console.log(`throughput=${report.totals.throughputRps.toFixed(2)} req/s`)
  console.log(`report=${outPath}`)

  if (failRate > failRateThreshold) {
    console.error(
      `Fail rate ${failRate.toFixed(4)} exceeded threshold ${failRateThreshold.toFixed(4)}`
    )
    process.exit(2)
  }
}

run().catch((err) => {
  console.error('[simulateAppUsers] fatal', err)
  process.exit(1)
})

