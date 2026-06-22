// Supabase Edge Function: auth-reset-password-secure
// TICKET-AUTH-RESET-SECURITY-001
//
// Server-side password update for the recovery flow.
// Replaces the direct supabase.auth.updateUser({ password }) client call.
//
// Security model:
//   1. Caller must present a valid authenticated JWT (verified by getUser).
//   2. Caller must supply a permitId issued by auth-register-recovery for
//      their specific user_id — validated against platform.auth_recovery_permits.
//   3. Permit must be unused (used_at IS NULL) and not expired (expires_at > now).
//   4. Permit is marked used BEFORE the password update — replay-safe even on
//      partial failure (Admin API error).
//   5. Password update performed via Admin API (service role) — never via
//      supabase.auth.updateUser() which does not enforce recovery provenance.
//
// Closes the attack:
//   Authenticated user + manual sessionStorage write + /reset-password navigation
//   → Edge Function rejects: no valid permit exists in the DB for that user.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://vibezcitizens.com",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Minimum password length — mirrors registerPasswordRules.model.js client-side rule.
const MIN_PASSWORD_LENGTH = 8

// UUID format guard — permit IDs must be v4 UUIDs.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  // ── 1. Extract Authorization header ──────────────────────────────────────
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401)
  }

  // ── 2. Parse request body ─────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid request body" }, 400)
  }

  const { permitId, password } = body ?? {}

  if (typeof permitId !== "string" || !UUID_RE.test(permitId)) {
    return json({ error: "Missing or invalid permitId" }, 400)
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return json({ error: "Password does not meet requirements" }, 400)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server configuration error" }, 500)
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // ── 3. Verify JWT ─────────────────────────────────────────────────────────
  const jwt = authHeader.slice(7)
  const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt)
  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401)
  }

  // ── 4. Validate permit — must belong to caller, be unused, and not expired ─
  const now = new Date().toISOString()

  const { data: permit, error: permitError } = await adminClient
    .schema("platform")
    .from("auth_recovery_permits")
    .select("id, user_id, expires_at, used_at")
    .eq("id", permitId)
    .eq("user_id", user.id)
    .is("used_at", null)
    .gt("expires_at", now)
    .single()

  if (permitError || !permit) {
    return json({ error: "Invalid, expired, or already-used recovery permit." }, 403)
  }

  // ── 5. Mark permit used FIRST — replay-safe on partial failure ────────────
  const { error: markError } = await adminClient
    .schema("platform")
    .from("auth_recovery_permits")
    .update({ used_at: now })
    .eq("id", permit.id)

  if (markError) {
    console.error("[auth-reset-password-secure] failed to mark permit used:", markError.message)
    return json({ error: "Internal error" }, 500)
  }

  // ── 6. Update password via Admin API ─────────────────────────────────────
  // Admin API does not require a recovery session — the server-side permit
  // validation above IS the recovery provenance check.
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    user.id,
    { password },
  )

  if (updateError) {
    // Permit is already consumed — do not roll back.
    // Prevents replay with an invalid password from re-using the permit.
    console.error("[auth-reset-password-secure] password update failed:", updateError.message)
    return json({ error: "Password update failed. Please request a new reset link." }, 500)
  }

  return json({ ok: true }, 200)
})
