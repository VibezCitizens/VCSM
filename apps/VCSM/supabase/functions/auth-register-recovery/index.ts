// Supabase Edge Function: auth-register-recovery
// TICKET-AUTH-RESET-SECURITY-001
//
// Issues a server-side single-use recovery permit.
// Called immediately when AuthProvider receives PASSWORD_RECOVERY from Supabase.
// The permit ID is stored client-side (sessionStorage) and consumed server-side
// by auth-reset-password-secure before any password update is allowed.
//
// ─── PHASE 1 RESEARCH: Supabase Recovery Session Claims ──────────────────────
//
//   auth.jwt() / auth.getUser() / auth.getSession() for PASSWORD_RECOVERY flows:
//
//   JWT AMR field:
//     GoTrue records recovery token verification as method="otp" in the amr array.
//     The string "recovery" does NOT appear as an AMR method value in Supabase
//     auth-js v2 (confirmed by codebase audit — setNewPassword.controller.js,
//     authored against Supabase v2.50.0). AMR cannot discriminate recovery sessions
//     from OTP/magic-link sessions. NOT used here.
//
//   JWT iat field:
//     The session issue timestamp (seconds). For a legitimate recovery flow the
//     session is created at the moment the user's recovery code is exchanged.
//     A fresh iat confirms the session was just established.
//
//   Admin API user.recovery_sent_at:
//     Set by GoTrue when a password recovery email is dispatched. Persists until
//     the user's next password update. Proves the user REQUESTED a recovery.
//
//   VALIDATION CHAIN (this function):
//     1. JWT is valid — server-verified via getUser().
//     2. JWT iat is recent — session was established within RECOVERY_SESSION_MAX_AGE_SECONDS.
//     3. JWT iat > recovery_sent_at — session was established AFTER recovery was requested.
//     4. recovery_sent_at is within RECOVERY_TTL_SECONDS — request is not stale.
//     5. All checks pass → insert permit row, return permit ID.
//
//   RESIDUAL RISK (self-exploitation only):
//     A user who (a) requests a reset, (b) immediately authenticates via password auth,
//     then (c) calls this endpoint with a fresh session that post-dates recovery_sent_at
//     could theoretically obtain a permit. Impact: self-only password change — identical
//     to what the same user can do through account settings. No cross-user path.
//     GoTrue does not expose a JWT claim that exclusively identifies recovery sessions.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://vibezcitizens.com",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// How fresh the recovery session JWT must be (seconds since iat).
const RECOVERY_SESSION_MAX_AGE_SECONDS = 5 * 60 // 5 minutes

// How long after recovery_sent_at the permit registration window stays open.
// Matches Supabase's default recovery link expiry (1 hour).
const RECOVERY_TTL_SECONDS = 60 * 60 // 1 hour

// How long the issued permit remains valid for the password-update step.
const PERMIT_TTL_SECONDS = 10 * 60 // 10 minutes

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

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server configuration error" }, 500)
  }

  // ── 1. Verify JWT via service role getUser ────────────────────────────────
  // Service role client used so getUser() validates the JWT signature server-side.
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const jwt = authHeader.slice(7)
  const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt)
  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401)
  }

  // ── 2. Decode JWT payload to read iat ─────────────────────────────────────
  let iat: number
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]))
    iat = payload.iat
    if (typeof iat !== "number") throw new Error("missing iat")
  } catch {
    return json({ error: "Unauthorized" }, 401)
  }

  const nowSeconds = Math.floor(Date.now() / 1000)

  // ── 3. Session freshness — must be recently established ───────────────────
  if ((nowSeconds - iat) > RECOVERY_SESSION_MAX_AGE_SECONDS) {
    return json({ error: "Recovery session is too old. Please use your reset link again." }, 403)
  }

  // ── 4. Fetch admin user record to read recovery_sent_at ───────────────────
  const { data: adminUserData, error: adminError } = await adminClient.auth.admin.getUserById(user.id)
  if (adminError || !adminUserData?.user) {
    console.error("[auth-register-recovery] admin.getUserById failed:", adminError?.message)
    return json({ error: "Internal error" }, 500)
  }

  const recoverySentAtRaw = adminUserData.user.recovery_sent_at
  if (!recoverySentAtRaw) {
    return json({ error: "No recovery request found for this account." }, 403)
  }

  const recoverySentAtSeconds = Math.floor(new Date(recoverySentAtRaw).getTime() / 1000)

  // ── 5. Session must post-date the recovery request ────────────────────────
  if (iat < recoverySentAtSeconds) {
    return json({ error: "Session predates the recovery request." }, 403)
  }

  // ── 6. Recovery request must not be stale ────────────────────────────────
  if ((nowSeconds - recoverySentAtSeconds) > RECOVERY_TTL_SECONDS) {
    return json({ error: "Recovery request has expired. Please request a new reset link." }, 403)
  }

  // ── 7. Issue server-side single-use permit ────────────────────────────────
  const expiresAt = new Date((nowSeconds + PERMIT_TTL_SECONDS) * 1000).toISOString()

  const { data: permit, error: insertError } = await adminClient
    .schema("platform")
    .from("auth_recovery_permits")
    .insert({ user_id: user.id, expires_at: expiresAt })
    .select("id")
    .single()

  if (insertError || !permit) {
    console.error("[auth-register-recovery] permit insert failed:", insertError?.message)
    return json({ error: "Internal error" }, 500)
  }

  return json({ permitId: permit.id }, 200)
})
