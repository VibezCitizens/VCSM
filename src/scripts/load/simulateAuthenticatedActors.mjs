#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

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

function nowIso() {
  return new Date().toISOString()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function percentile(sorted, p) {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

function summarizeDurations(values) {
  if (!values.length) {
    return { minMs: 0, maxMs: 0, avgMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0 }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const total = values.reduce((sum, n) => sum + n, 0)
  return {
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    avgMs: total / values.length,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
  }
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const text = fs.readFileSync(filePath, 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    const value = t.slice(eq + 1).trim()
    env[key] = value
  }
  return env
}

function makeClient(url, anonKey) {
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function createStats() {
  return {
    totals: {
      actions: 0,
      successes: 0,
      failures: 0,
      byStatus: {},
      byError: {},
    },
    operations: {},
    users: {
      seeded: 0,
      existing: 0,
      failedSeed: 0,
      simulated: 0,
      failedSimulation: 0,
    },
  }
}

function recordResult(stats, opName, result) {
  if (!stats.operations[opName]) {
    stats.operations[opName] = {
      actions: 0,
      successes: 0,
      failures: 0,
      byStatus: {},
      byError: {},
      durationsMs: [],
    }
  }
  const op = stats.operations[opName]

  stats.totals.actions += 1
  op.actions += 1
  op.durationsMs.push(result.durationMs)

  const statusCode = String(result.status ?? 0)
  stats.totals.byStatus[statusCode] = (stats.totals.byStatus[statusCode] || 0) + 1
  op.byStatus[statusCode] = (op.byStatus[statusCode] || 0) + 1

  if (result.ok) {
    stats.totals.successes += 1
    op.successes += 1
  } else {
    stats.totals.failures += 1
    op.failures += 1
    const key = result.error || `http_${statusCode}`
    stats.totals.byError[key] = (stats.totals.byError[key] || 0) + 1
    op.byError[key] = (op.byError[key] || 0) + 1
  }
}

function extractErrorName(err) {
  const msg = String(err?.message || err?.name || err || 'unknown_error')
  if (/Invalid login credentials/i.test(msg)) return 'invalid_login'
  if (/Email not confirmed/i.test(msg)) return 'email_not_confirmed'
  if (/rate limit/i.test(msg) || /Too Many Requests/i.test(msg)) return 'rate_limited'
  return msg.slice(0, 200)
}

async function withRetry(fn, retries = 2, baseDelayMs = 180) {
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= retries) throw err
      const delay = baseDelayMs * Math.pow(2, attempt)
      await sleep(delay)
      attempt += 1
    }
  }
}

async function timed(op) {
  const start = performance.now()
  try {
    const data = await op()
    return { ok: true, status: 200, durationMs: performance.now() - start, error: null, data }
  } catch (err) {
    const durationMs = performance.now() - start
    const status = Number.isInteger(err?.status) ? err.status : 0
    return { ok: false, status, durationMs, error: extractErrorName(err), data: null }
  }
}

async function resolvePublicRealmId(client) {
  const { data, error } = await client
    .schema('vc')
    .from('realms')
    .select('id')
    .eq('is_void', false)
    .maybeSingle()
  if (error) throw error
  if (!data?.id) throw new Error('public realm not found')
  return data.id
}

async function ensureProfile(client, user, usernameBase, displayName) {
  const birthdate = '1995-01-15'
  const age = 31

  const { data: generated, error: genError } = await client.rpc('generate_username', {
    _display_name: displayName,
    _username: usernameBase,
  })
  if (genError) throw genError
  const username = generated || `${usernameBase}${Math.floor(Math.random() * 9000) + 1000}`

  const payload = {
    id: user.id,
    email: user.email || null,
    display_name: displayName,
    username,
    birthdate,
    age,
    is_adult: true,
    sex: null,
    publish: true,
    discoverable: true,
    updated_at: nowIso(),
  }

  const { error: upsertError } = await client.from('profiles').upsert(payload)
  if (upsertError) throw upsertError
}

async function resolveOrCreateActor(client, userId) {
  const { data: ownerRows, error: ownerError } = await client
    .schema('vc')
    .from('actor_owners')
    .select(`
      actor_id,
      actor:actors (
        id,
        kind,
        profile_id,
        is_void
      )
    `)
    .eq('user_id', userId)

  if (ownerError) throw ownerError

  const actors = (ownerRows || []).map((row) => row.actor).filter(Boolean)
  const userActor = actors.find((a) => a.kind === 'user')
  if (userActor?.id) return userActor.id

  const { error: createErr } = await client
    .schema('vc')
    .rpc('create_actor_for_user', {
      p_kind: 'user',
      p_profile_id: userId,
      p_vport_id: null,
      p_is_void: false,
      p_is_primary: true,
    })
  if (createErr) throw createErr

  const { data: actorRow, error: actorErr } = await client
    .schema('vc')
    .from('actors')
    .select('id, kind, profile_id')
    .eq('profile_id', userId)
    .eq('kind', 'user')
    .maybeSingle()

  if (actorErr) throw actorErr
  if (!actorRow?.id) throw new Error('failed to resolve actor after create_actor_for_user')
  return actorRow.id
}

async function authSignInOrSeed({
  url,
  anonKey,
  email,
  password,
  seedMissing,
  usernameBase,
  displayName,
  realmIdHint = null,
}) {
  const client = makeClient(url, anonKey)

  async function signIn() {
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data?.user) throw new Error('signIn returned no user')
    return data.user
  }

  async function signUpThenSignIn() {
    const { data, error } = await client.auth.signUp({ email, password })
    if (error) throw error
    if (!data?.user) {
      throw new Error('signup returned no user; likely email confirmation is required')
    }

    if (!data?.session) {
      // If signUp did not create a session, try explicit login.
      const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
        email,
        password,
      })
      if (loginError) throw loginError
      if (!loginData?.user) throw new Error('post-signup login returned no user')
      return { user: loginData.user, seeded: true }
    }

    return { user: data.user, seeded: true }
  }

  let user
  let seeded = false

  try {
    user = await withRetry(signIn, 2, 220)
  } catch (err) {
    if (!seedMissing) throw err
    const name = extractErrorName(err)
    if (name !== 'invalid_login') throw err
    const created = await withRetry(signUpThenSignIn, 2, 260)
    user = created.user
    seeded = created.seeded
  }

  await ensureProfile(client, user, usernameBase, displayName)
  const actorId = await resolveOrCreateActor(client, user.id)

  let realmId = realmIdHint || null
  if (!realmId) {
    try {
      realmId = await resolvePublicRealmId(client)
    } catch {
      realmId = null
    }
  }

  const { data: sessionData } = await client.auth.getSession()
  const session = sessionData?.session || null

  return {
    email,
    userId: user.id,
    actorId,
    realmId,
    accessToken: session?.access_token || null,
    refreshToken: session?.refresh_token || null,
    seeded,
  }
}

async function mapConcurrent(items, concurrency, mapper) {
  const out = new Array(items.length)
  let idx = 0
  const workerCount = Math.max(1, Math.min(concurrency, items.length || 1))

  async function worker() {
    for (;;) {
      const i = idx
      idx += 1
      if (i >= items.length) return
      out[i] = await mapper(items[i], i)
    }
  }

  const workers = Array.from({ length: workerCount }, () => worker())
  await Promise.all(workers)
  return out
}

async function opReadInbox(client, actorId) {
  const { error } = await client
    .schema('vc')
    .from('inbox_entries')
    .select('conversation_id,last_message_at,unread_count,folder')
    .eq('actor_id', actorId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(20)
  if (error) throw error
}

async function opCreatePost(client, identity) {
  const payload = {
    actor_id: identity.actorId,
    user_id: identity.userId,
    realm_id: identity.realmId,
    text: `load-test ${identity.actorId} ${Date.now()}`,
    title: null,
    media_url: null,
    media_type: 'text',
    post_type: 'post',
    tags: [],
    created_at: nowIso(),
    location_text: null,
  }

  const { error } = await client
    .schema('vc')
    .from('posts')
    .insert(payload)
    .select('id')
    .maybeSingle()
  if (error) throw error
}

async function opDmMessage(client, identity, partnerActorId) {
  const { data: conversationId, error: convoError } = await client
    .schema('vc')
    .rpc('vc_get_or_create_one_to_one', {
      a1: identity.actorId,
      a2: partnerActorId,
      p_realm_id: identity.realmId,
    })

  if (convoError) throw convoError
  if (!conversationId) throw new Error('vc_get_or_create_one_to_one returned no conversation id')

  const { error: messageError } = await client
    .schema('vc')
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_actor_id: identity.actorId,
      message_type: 'text',
      body: `sim-msg ${Date.now()}`,
      client_id: crypto.randomUUID(),
    })
    .select('id')
    .maybeSingle()

  if (messageError) throw messageError
}

async function opReadFeed(client, identity) {
  const { error } = await client
    .schema('vc')
    .from('posts')
    .select('id,actor_id,created_at,text')
    .eq('realm_id', identity.realmId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
}

async function opReadOwnPosts(client, identity) {
  const { error } = await client
    .schema('vc')
    .from('posts')
    .select('id,actor_id,created_at,text')
    .eq('actor_id', identity.actorId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
}

async function runUserSimulation({
  url,
  anonKey,
  identity,
  allActors,
  actionsPerUser,
  thinkMinMs,
  thinkMaxMs,
  stats,
}) {
  const client = makeClient(url, anonKey)
  if (identity.accessToken && identity.refreshToken) {
    const { error: setErr } = await client.auth.setSession({
      access_token: identity.accessToken,
      refresh_token: identity.refreshToken,
    })
    if (setErr) {
      const auth = await client.auth.signInWithPassword({
        email: identity.email,
        password: identity.password,
      })
      if (auth.error || !auth.data?.user) {
        throw auth.error || new Error('failed to sign in simulation user')
      }
    }
  } else {
    const auth = await client.auth.signInWithPassword({
      email: identity.email,
      password: identity.password,
    })
    if (auth.error || !auth.data?.user) {
      throw auth.error || new Error('failed to sign in simulation user')
    }
  }

  for (let i = 0; i < actionsPerUser; i += 1) {
    const canUseRealmOps = Boolean(identity.realmId)
    const r = Math.random()
    if (r < 0.35) {
      const result = await timed(() => opReadInbox(client, identity.actorId))
      recordResult(stats, 'read_inbox', result)
    } else if (r < 0.65 && canUseRealmOps) {
      const result = await timed(() => opCreatePost(client, identity))
      recordResult(stats, 'create_post', result)
    } else if (r < 0.9 && canUseRealmOps) {
      const partner = pickRandom(allActors.filter((a) => a !== identity.actorId))
      const result = await timed(() => opDmMessage(client, identity, partner))
      recordResult(stats, 'dm_message', result)
    } else {
      if (canUseRealmOps) {
        const result = await timed(() => opReadFeed(client, identity))
        recordResult(stats, 'read_feed', result)
      } else {
        const result = await timed(() => opReadOwnPosts(client, identity))
        recordResult(stats, 'read_own_posts', result)
      }
    }

    const span = Math.max(0, thinkMaxMs - thinkMinMs)
    const waitMs = thinkMinMs + Math.floor(Math.random() * (span + 1))
    if (waitMs > 0) await sleep(waitMs)
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2))
  const env = readEnvFile(path.join(projectRoot, '.env'))

  const url = args.supabaseUrl || process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
  const anonKey = args.anonKey || process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing Supabase url/anon key')

  const users = toInt(args.users, 1000)
  const concurrency = toInt(args.concurrency, 80)
  const seedConcurrency = toInt(args.seedConcurrency, 25)
  const actionsPerUser = toInt(args.actions, 4)
  const thinkMinMs = toInt(args.thinkMinMs, 30)
  const thinkMaxMs = toInt(args.thinkMaxMs, 110)
  const seedMissing = String(args.seedMissing ?? '0') === '1'
  const failRateThreshold = toFloat(args.failRateThreshold, 0.05)

  const userPrefix = String(args.userPrefix || 'vcsim')
  const emailDomain = String(args.emailDomain || 'vibezcitizens-load.local')
  const password = String(args.password || process.env.LOADTEST_PASSWORD || 'LoadTest#12345!')
  const outDir = path.resolve(projectRoot, args.outDir || 'load-reports')

  const stats = createStats()
  const startedAt = performance.now()

  let sharedRealmId = args.realmId || null

  const userInputs = Array.from({ length: users }, (_, idx) => {
    const n = String(idx + 1).padStart(4, '0')
    const email = `${userPrefix}+${n}@${emailDomain}`
    return {
      email,
      password,
      usernameBase: `${userPrefix}_${n}`,
      displayName: `Load ${n}`,
    }
  })

  const seededIdentities = await mapConcurrent(userInputs, seedConcurrency, async (item) => {
    try {
      const result = await authSignInOrSeed({
        url,
        anonKey,
        email: item.email,
        password: item.password,
        seedMissing,
        usernameBase: item.usernameBase,
        displayName: item.displayName,
        realmIdHint: sharedRealmId,
      })
      if (result.seeded) stats.users.seeded += 1
      else stats.users.existing += 1

      if (!sharedRealmId && result.realmId) {
        sharedRealmId = result.realmId
      }

      return {
        email: item.email,
        password: item.password,
        userId: result.userId,
        actorId: result.actorId,
        realmId: result.realmId || sharedRealmId || null,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }
    } catch (err) {
      stats.users.failedSeed += 1
      return {
        email: item.email,
        password: item.password,
        seedError: extractErrorName(err),
      }
    }
  })

  const readyUsers = seededIdentities.filter((u) => u.actorId && u.userId)
  if (readyUsers.length === 0) {
    throw new Error(
      'No authenticated actors available. If pool does not exist yet, re-run with --seedMissing=1.'
    )
  }

  if (!sharedRealmId) {
    const fromPool = readyUsers.find((u) => u.realmId)?.realmId || null
    if (fromPool) sharedRealmId = fromPool
  }

  if (sharedRealmId) {
    for (const u of readyUsers) {
      if (!u.realmId) u.realmId = sharedRealmId
    }
  }

  const actorIds = readyUsers.map((u) => u.actorId)
  await mapConcurrent(readyUsers, concurrency, async (identity) => {
    try {
      await runUserSimulation({
        url,
        anonKey,
        identity,
        allActors: actorIds,
        actionsPerUser,
        thinkMinMs,
        thinkMaxMs,
        stats,
      })
      stats.users.simulated += 1
    } catch (err) {
      stats.users.failedSimulation += 1
      const result = {
        ok: false,
        status: 0,
        durationMs: 0,
        error: `user_simulation_failed:${extractErrorName(err)}`,
      }
      recordResult(stats, 'user_session', result)
    }
  })

  const endedAt = performance.now()
  const durationSec = (endedAt - startedAt) / 1000

  const allDurations = Object.values(stats.operations).flatMap((op) => op.durationsMs)
  const latency = summarizeDurations(allDurations)
  const opSummary = Object.entries(stats.operations)
    .map(([name, op]) => {
      const d = summarizeDurations(op.durationsMs)
      return {
        operation: name,
        actions: op.actions,
        successes: op.successes,
        failures: op.failures,
        ...d,
      }
    })
    .sort((a, b) => b.actions - a.actions)

  const failRate = stats.totals.actions
    ? stats.totals.failures / stats.totals.actions
    : 0

  const report = {
    runAt: nowIso(),
    config: {
      usersRequested: users,
      usersReady: readyUsers.length,
      concurrency,
      seedConcurrency,
      actionsPerUser,
      thinkMinMs,
      thinkMaxMs,
      seedMissing,
      userPrefix,
      emailDomain,
      realmId: sharedRealmId,
      failRateThreshold,
    },
    totals: {
      ...stats.totals,
      failRate,
      durationSec,
      throughputOps: stats.totals.actions / Math.max(durationSec, 0.001),
    },
    users: stats.users,
    latency,
    operationSummary: opSummary,
    seedFailures: seededIdentities
      .filter((u) => u.seedError)
      .slice(0, 200)
      .map((u) => ({ email: u.email, error: u.seedError })),
  }

  fs.mkdirSync(outDir, { recursive: true })
  const stamp = new Date().toISOString().replaceAll(':', '-')
  const outPath = path.join(outDir, `load-auth-${users}u-${stamp}.json`)
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')

  console.log('\nAuthenticated actor simulation finished')
  console.log(`users requested=${users} ready=${readyUsers.length} simulated=${stats.users.simulated}`)
  console.log(
    `actions=${report.totals.actions} failures=${report.totals.failures} failRate=${(failRate * 100).toFixed(2)}%`
  )
  console.log(
    `latency p50=${latency.p50Ms.toFixed(1)}ms p95=${latency.p95Ms.toFixed(1)}ms p99=${latency.p99Ms.toFixed(1)}ms`
  )
  console.log(`throughput=${report.totals.throughputOps.toFixed(2)} ops/s`)
  console.log(`report=${outPath}`)

  if (failRate > failRateThreshold) {
    console.error(
      `Fail rate ${failRate.toFixed(4)} exceeded threshold ${failRateThreshold.toFixed(4)}`
    )
    process.exit(2)
  }
}

run().catch((err) => {
  console.error('[simulateAuthenticatedActors] fatal', err)
  process.exit(1)
})
