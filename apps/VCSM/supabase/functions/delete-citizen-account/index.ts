// Supabase Edge Function: delete-citizen-account
// Permanently deletes a Citizen's app/domain data AND their Supabase Auth user.
//
// Ordering guarantee:
//   1. Verify caller via JWT (anon client — enforces auth.uid() inside RPC)
//   2. Delete app/domain data via soft_delete_citizen_account() RPC
//      → marks public.profiles.is_deleted = true, username = NULL
//      → marks vc.actors.is_deleted = true
//   3. Delete Supabase Auth user via admin client (service role key)
//
// If step 2 fails → abort, return error, auth user is NOT deleted.
// If step 3 fails → app data already deleted; row inserted into
//   platform.failed_account_deletions for admin recovery; returns AUTH_DELETE_FAILED.
//
// Security:
//   - Deletes only the user identified by the verified JWT. No userId accepted from client.
//   - SUPABASE_SERVICE_ROLE_KEY never leaves this function.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://vibezcitizens.com",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

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

  // ── 1. Extract and validate Bearer token ─────────────────────
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  // Anon client scoped to the caller's JWT.
  // auth.uid() inside soft_delete_citizen_account() resolves to this user — RLS enforced.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth:   { persistSession: false },
  })

  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // ── 2. Delete app/domain data via existing RPC ────────────────
  // SECURITY DEFINER function — only touches the calling user's own rows via auth.uid().
  // Also releases public.profiles.username (sets to NULL) so the unique slot is freed.
  const { error: appError } = await userClient.rpc("soft_delete_citizen_account")
  if (appError) {
    const msg    = appError.message ?? String(appError)
    const status = msg.includes("CITIZEN_NOT_FOUND") ? 404 : 500
    return json({ error: msg }, status)
  }

  // ── 3. Delete Supabase Auth user ──────────────────────────────
  // Only reached after app data deletion succeeds.
  const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)
  if (authError) {
    // App data is gone but auth row survived.
    // Log to platform.failed_account_deletions for admin recovery.
    console.error("[delete-citizen-account] auth.admin.deleteUser failed after app data deleted", {
      userId: user.id,
      error:  authError.message,
    })

    const { error: logError } = await adminClient
      .schema("platform")
      .from("failed_account_deletions")
      .insert({
        user_id:       user.id,
        email:         user.email ?? null,
        failure_stage: "auth_delete_failed",
        error_code:    authError.status ? String(authError.status) : null,
        error_message: authError.message ?? null,
      })

    if (logError) {
      // Non-fatal — the auth deletion failure is already logged to console above.
      console.error("[delete-citizen-account] failed to write to failed_account_deletions", {
        logError: logError.message,
      })
    }

    return json({
      error: "Account data was deleted but the authentication record could not be removed. Contact support.",
      code:  "AUTH_DELETE_FAILED",
    }, 500)
  }

  return json({ ok: true }, 200)
})
