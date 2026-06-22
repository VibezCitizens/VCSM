// worker.test.mjs — Dev-only worker security verification
// Run from repo root:
//   node zNOTFORPRODUCTION/debuggers/worker-upload/worker.test.mjs
// NEVER ship this file.

import { createServer } from 'node:http'
import worker from '../../../apps/VCSM/cloudflare-worker-upload/worker.js'

// ── Helpers ────────────────────────────────────────────────────────────────

function b64urlEncode(bytes) {
  const arr = new Uint8Array(bytes)
  let str = ''
  for (const byte of arr) str += String.fromCharCode(byte)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function jsonToB64url(obj) {
  return b64urlEncode(new TextEncoder().encode(JSON.stringify(obj)))
}

async function signJwt(header, payload, privateKey) {
  const h = jsonToB64url(header)
  const p = jsonToB64url(payload)
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(`${h}.${p}`)
  )
  return `${h}.${p}.${b64urlEncode(sig)}`
}

let passed = 0
let failed = 0
function ok(label) { console.log(`  ✓ ${label}`); passed++ }
function fail(label, detail) { console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`); failed++ }
function check(label, got, expected) {
  if (got === expected) ok(`${label} → ${got}`)
  else fail(label, `expected ${expected}, got ${got}`)
}

// ── Key Generation ─────────────────────────────────────────────────────────

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  {
    name: 'RSASSA-PKCS1-v1_5',
    hash: 'SHA-256',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
  },
  true,
  ['sign', 'verify']
)

const jwk = await crypto.subtle.exportKey('jwk', publicKey)
Object.assign(jwk, { kid: 'test-key-1', use: 'sig', alg: 'RS256' })

// ── Mock JWKS Server ───────────────────────────────────────────────────────

const jwksBody = JSON.stringify({ keys: [jwk] })
const jwksServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(jwksBody)
})
await new Promise((resolve) => jwksServer.listen(0, '127.0.0.1', resolve))
const { port } = jwksServer.address()
const MOCK_URL = `http://127.0.0.1:${port}`

// ── Mock Env ───────────────────────────────────────────────────────────────

const env = {
  SUPABASE_URL: MOCK_URL,
  R2_BUCKET: {
    put: async (_key, stream) => {
      const reader = stream.getReader()
      while (!(await reader.read()).done) {}
    },
  },
}

// ── Token Builders ─────────────────────────────────────────────────────────

const now = Math.floor(Date.now() / 1000)
const sub = '00000000-0000-0000-0000-000000000001'

const validToken = await signJwt(
  { alg: 'RS256', kid: 'test-key-1', typ: 'JWT' },
  { sub, exp: now + 3600, iat: now },
  privateKey
)

const expiredToken = await signJwt(
  { alg: 'RS256', kid: 'test-key-1', typ: 'JWT' },
  { sub, exp: now - 3600, iat: now - 7200 },
  privateKey
)

const wrongAlgToken = [
  jsonToB64url({ alg: 'HS256', kid: 'test-key-1', typ: 'JWT' }),
  jsonToB64url({ sub, exp: now + 3600 }),
  'fakesignature',
].join('.')

const malformedToken = 'only.twoparts'

// ── Request Builder ────────────────────────────────────────────────────────

function makeUploadRequest(token, { key = 'vibes/test.jpg', mimeType = 'image/jpeg' } = {}) {
  const form = new FormData()
  form.append('file', new Blob(['fake-image-data'], { type: mimeType }), 'test.jpg')
  form.append('key', key)
  return new Request('https://upload.vibezcitizens.com/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────

console.log('\nWorker Security Tests\n')

// 1. No Authorization header → 401
console.log('1. No Authorization header')
check(
  'status',
  (await worker.fetch(
    new Request('https://upload.vibezcitizens.com/', { method: 'POST', body: 'x' }),
    env
  )).status,
  401
)

// 2. Malformed token (2 parts) → 401
console.log('2. Malformed token (2 parts)')
check(
  'status',
  (await worker.fetch(
    new Request('https://upload.vibezcitizens.com/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${malformedToken}` },
      body: 'x',
    }),
    env
  )).status,
  401
)

// 3. Expired token → 401  (also warms JWKS cache for tests 5-7)
console.log('3. Expired token')
check(
  'status',
  (await worker.fetch(makeUploadRequest(expiredToken), env)).status,
  401
)

// 4. Wrong algorithm (HS256) → 401
console.log('4. Wrong algorithm (HS256)')
check(
  'status',
  (await worker.fetch(
    new Request('https://upload.vibezcitizens.com/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${wrongAlgToken}` },
      body: 'x',
    }),
    env
  )).status,
  401
)

// 5. Valid token + valid file → 200
console.log('5. Valid token + valid file')
check(
  'status',
  (await worker.fetch(makeUploadRequest(validToken), env)).status,
  200
)

// 6. Valid token + path traversal key → 400
console.log('6. Path traversal key (../../etc/passwd)')
check(
  'status',
  (await worker.fetch(makeUploadRequest(validToken, { key: '../../etc/passwd' }), env)).status,
  400
)

// 7. Valid token + blocked MIME (SVG) → 415
console.log('7. Blocked MIME (image/svg+xml)')
check(
  'status',
  (await worker.fetch(
    makeUploadRequest(validToken, { key: 'vibes/evil.svg', mimeType: 'image/svg+xml' }),
    env
  )).status,
  415
)

// ── Summary ────────────────────────────────────────────────────────────────

jwksServer.close()
console.log(`\n${passed} passed, ${failed} failed`)
if (failed === 0) console.log('ALL TESTS PASSED\n')
else { console.error('TESTS FAILED\n'); process.exitCode = 1 }
