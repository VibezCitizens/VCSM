// Supabase Edge Function: monitoring-ingest-error
// Validates, normalizes, and persists error events from any VCSM surface.
//
// Revised to match live monitoring schema (2026-06-05):
//   - project_id payload field maps to monitoring.projects.key (RPC resolves UUID)
//   - source removed (no column in live schema)
//   - level → severity (debug|info|warning|error|fatal)
//   - name → error_name
//   - user_actor_id hashed server-side → user_actor_id_hash (PII never reaches DB)
//   - session_id hashed server-side → session_id_hash
//   - metadata → tags / context / breadcrumbs
//   - release (text) → release_version (RPC resolves release_id UUID)
//   - Direct-insert fallback removed — monitoring schema not in PostgREST db-schemas
//   - New fields: feature, module, behavior_id, controller, operation,
//                 request_id, correlation_id, url, user_agent,
//                 platform, runtime, app_scope, is_handled
//
// Security:
//   - SUPABASE_SERVICE_ROLE_KEY never exposed to client
//   - user_actor_id and session_id hashed with SHA-256 before leaving this function
//   - Raw DB errors never returned to caller
//   - Full stack traces not logged in production
//   - Payload capped at 64 KB; data bags sanitized to max depth 3

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://vibezcitizens.com",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const MAX_PAYLOAD_BYTES = 64 * 1024
const MAX_OBJECT_DEPTH  = 3

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// SHA-256 hex digest.
// Used to hash PII fields (user_actor_id, session_id) before they reach the DB.
async function sha256hex(input: string): Promise<string> {
  const encoded  = new TextEncoder().encode(input)
  const hashBuf  = await crypto.subtle.digest("SHA-256", encoded)
  const hashArr  = Array.from(new Uint8Array(hashBuf))
  return hashArr.map(b => b.toString(16).padStart(2, "0")).join("")
}

// Deterministic fingerprint — identifies the same logical error across occurrences.
// Inputs: project_key + environment + error_name + normalized_message + top_stack_frame.
// source is intentionally excluded (not a column in the live schema).
async function generateFingerprint(parts: string[]): Promise<string> {
  return sha256hex(parts.join("|"))
}

// Extract first "at ..." stack frame and strip line/column numbers so the
// fingerprint stays stable across minor code edits.
function extractTopFrame(stack: string | undefined): string {
  if (!stack) return ""
  const frame = stack
    .split("\n")
    .map(l => l.trim())
    .find(l => l.startsWith("at ")) ?? ""
  return frame.replace(/:\d+:\d+/g, "").replace(/\?.*$/, "")
}

function normalizeMessage(msg: string): string {
  return msg.trim().replace(/\s+/g, " ").slice(0, 500)
}

// Shallow sanitizer — prevents deeply nested objects from reaching the DB.
function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > MAX_OBJECT_DEPTH) return "[truncated]"
  if (obj === null || typeof obj !== "object") return obj
  if (Array.isArray(obj)) {
    return obj.slice(0, 50).map(v => sanitize(v, depth + 1))
  }
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>).slice(0, 50)) {
    safe[k] = sanitize(v, depth + 1)
  }
  return safe
}

const VALID_SEVERITIES   = new Set(["debug", "info", "warning", "error", "fatal"])
const VALID_ENVIRONMENTS = new Set(["development", "staging", "production"])
const PGRST_NOT_FOUND    = new Set(["PGRST202", "PGRST106"])

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405)
  }

  // ── Payload size guard ─────────────────────────────────────────────────────
  const contentLength = req.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return json({ ok: false, error: "Payload too large", code: "PAYLOAD_TOO_LARGE" }, 413)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }, 401)
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    const text = await req.text()
    if (text.length > MAX_PAYLOAD_BYTES) {
      return json({ ok: false, error: "Payload too large", code: "PAYLOAD_TOO_LARGE" }, 413)
    }
    body = JSON.parse(text)
  } catch {
    return json({ ok: false, error: "Invalid JSON", code: "INVALID_INPUT" }, 400)
  }

  // ── Validate required fields ───────────────────────────────────────────────
  // Accept either "project_id" or "project_key" — smoke test spec uses project_key.
  const project_id = (body.project_id ?? body.project_key) as string | undefined
  const { environment, severity, message } = body

  if (!project_id || typeof project_id !== "string" || !project_id.trim()) {
    return json({ ok: false, error: "project_id is required", code: "INVALID_INPUT" }, 400)
  }
  if (!environment || !VALID_ENVIRONMENTS.has(environment as string)) {
    return json({
      ok: false,
      error: `environment must be one of: ${[...VALID_ENVIRONMENTS].join(", ")}`,
      code: "INVALID_INPUT",
    }, 400)
  }
  if (!severity || !VALID_SEVERITIES.has(severity as string)) {
    return json({
      ok: false,
      error: `severity must be one of: ${[...VALID_SEVERITIES].join(", ")}`,
      code: "INVALID_INPUT",
    }, 400)
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return json({ ok: false, error: "message is required", code: "INVALID_INPUT" }, 400)
  }

  // ── Extract optional scalar fields ────────────────────────────────────────
  // str() returns trimmed string or null — never empty string.
  const str = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null

  const errorName      = str(body.error_name)
  const stack          = str(body.stack) ?? undefined
  const feature        = str(body.feature)
  const module_        = str(body.module)
  const behaviorId     = str(body.behavior_id)
  const route          = str(body.route)
  const controller     = str(body.controller)
  const operation      = str(body.operation)
  const requestId      = str(body.request_id)
  const correlationId  = str(body.correlation_id)
  const url            = str(body.url)
  const userAgent      = str(body.user_agent)
  const platform       = str(body.platform)
  const runtime        = str(body.runtime)
  const appScope       = str(body.app_scope)
  const releaseVersion = str(body.release_version)
  const isHandled      = typeof body.is_handled === "boolean" ? body.is_handled : true

  // ── PII hashing ────────────────────────────────────────────────────────────
  // user_actor_id and session_id are hashed with SHA-256 before leaving this
  // function. Raw values are never stored in the database.
  const rawUserActorId = str(body.user_actor_id)
  const rawSessionId   = str(body.session_id)

  const userActorIdHash = rawUserActorId ? await sha256hex(rawUserActorId) : null
  const sessionIdHash   = rawSessionId   ? await sha256hex(rawSessionId)   : null

  // ── Data bag sanitization ──────────────────────────────────────────────────
  const tags        = body.tags        ? sanitize(body.tags)        : null
  const context     = body.context     ? sanitize(body.context)     : null
  const breadcrumbs = Array.isArray(body.breadcrumbs)
    ? sanitize(body.breadcrumbs)
    : null

  // ── Fingerprint ────────────────────────────────────────────────────────────
  // Deterministic: same project + environment + error class + message + location
  // produces the same fingerprint, grouping repeated occurrences correctly.
  const normalizedMsg = normalizeMessage(message as string)
  const topFrame      = extractTopFrame(stack)

  const fingerprint = await generateFingerprint([
    (project_id as string).trim(),
    (environment as string).trim(),
    errorName ?? "",
    normalizedMsg,
    topFrame,
  ])

  // ── Build RPC payload ──────────────────────────────────────────────────────
  // project_key is the text key in monitoring.projects. The RPC resolves it to
  // the UUID project_id internally. Raw user/session values are not included.
  const event = {
    project_key:        (project_id as string).trim(),
    environment:        environment as string,
    severity:           severity as string,
    message:            normalizedMsg,
    error_name:         errorName,
    stack:              stack ?? null,
    feature,
    module:             module_,
    behavior_id:        behaviorId,
    route,
    controller,
    operation,
    user_actor_id_hash: userActorIdHash,
    session_id_hash:    sessionIdHash,
    request_id:         requestId,
    correlation_id:     correlationId,
    url,
    user_agent:         userAgent,
    platform,
    runtime,
    app_scope:          appScope,
    release_version:    releaseVersion,
    is_handled:         isHandled,
    tags,
    context,
    breadcrumbs,
    fingerprint,
    occurred_at: typeof body.occurred_at === "string"
      ? body.occurred_at
      : new Date().toISOString(),
  }

  // ── Persist via RPC ────────────────────────────────────────────────────────
  // monitoring_ingest_error_event lives in the public schema (PostgREST-accessible).
  // The monitoring schema tables are NOT in db-schemas — no direct insert fallback.
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const rpcCandidates = ["monitoring_ingest_error_event", "ingest_error_event"]

  for (const rpcName of rpcCandidates) {
    const { data: rpcData, error: rpcError } = await adminClient.rpc(rpcName, { p_event: event })

    if (!rpcError) {
      return json({
        ok:          true,
        event_id:    rpcData?.event_id ?? null,
        group_id:    rpcData?.group_id ?? null,
        fingerprint,
      }, 200)
    }

    const isNotFound =
      PGRST_NOT_FOUND.has(rpcError.code ?? "") ||
      rpcError.message?.includes("Could not find the function") ||
      rpcError.message?.includes("does not exist")

    if (!isNotFound) {
      // RPC exists but failed — return 500 immediately; do not try fallback.
      const isProduction = (environment as string) === "production"
      if (!isProduction) {
        console.error(`[monitoring-ingest-error] rpc ${rpcName} error:`, rpcError.code, rpcError.message)
      } else {
        console.error(`[monitoring-ingest-error] rpc ${rpcName} error:`, rpcError.code)
      }
      return json({
        ok:    false,
        error: "Failed to persist error event.",
        code:  "PERSISTENCE_FAILED",
      }, 500)
    }
    // PGRST202 / function not found → try next candidate
  }

  // All RPC candidates exhausted without finding the function.
  return json({
    ok:    false,
    error: "Monitoring database foundation is missing.",
    code:  "MONITORING_DB_MISSING",
  }, 501)
})
