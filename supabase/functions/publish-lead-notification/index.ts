// Supabase Edge Function: publish-lead-notification
// ============================================================================
// Bridges an anonymous business-card / directory lead insert to the EXISTING
// VCSM notification engine, so the owning VPORT actor receives one
// `lead_received` notification.
//
// Why this exists (TICKET-LEAD-NOTI-002):
//   - Leads insert through vport.submit_business_card_lead(...) (SECURITY DEFINER).
//   - Anonymous / Traffic-directory visitors have no VCSM session, and the app
//     publisher (publishVcsmNotification) intentionally requires a session, so
//     it cannot publish for them.
//   - Traffic is isolated and must not import VCSM/engine code — it invokes this
//     function over HTTP instead.
//   - This function runs server-side with the service role and calls the SAME
//     notification RPCs the engine uses (notification.create_event +
//     notification.insert_recipients). It does NOT reimplement recipients/
//     rendering, and does NOT touch the lead insert path.
//
// Forgery resistance (deliverable #4):
//   The caller supplies ONLY a leadId. The recipient actor, lead name, source,
//   and message preview are all derived server-side from the lead row. A caller
//   cannot direct a notification at an arbitrary actor.
//
// Security:
//   - SUPABASE_SERVICE_ROLE_KEY never leaves this function.
//   - source_actor_id is NULL (anonymous lead). The notification.events
//     source-actor ownership trigger allows NULL source actors and NULL
//     auth.uid() (service-role path) — no session guard is weakened.
//   - No lead PII is echoed back in the response; raw DB errors are not returned.
//   - No raw actor UUID is placed in any link path (linkPath stays null).
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGINS = new Set([
  "https://vibezcitizens.com",
  "https://traze.vibezcitizens.com",

])

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? ""
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://vibezcitizens.com"
  return {
    "Access-Control-Allow-Origin":  allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

const MAX_PAYLOAD_BYTES = 8 * 1024
const MESSAGE_PREVIEW_MAX = 140

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

function buildMessagePreview(message: unknown): string | null {
  if (typeof message !== "string") return null
  const trimmed = message.trim().replace(/\s+/g, " ")
  if (!trimmed) return null
  return trimmed.length > MESSAGE_PREVIEW_MAX
    ? `${trimmed.slice(0, MESSAGE_PREVIEW_MAX)}…`
    : trimmed
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors })
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405, cors)
  }

  // Require a bearer (anon key is sufficient — platform verifies the JWT).
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }, 401, cors)
  }

  const contentLength = req.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return json({ ok: false, error: "Payload too large", code: "PAYLOAD_TOO_LARGE" }, 413, cors)
  }

  // ── Parse body — only leadId is trusted ────────────────────────────────────
  let body: Record<string, unknown>
  try {
    const text = await req.text()
    if (text.length > MAX_PAYLOAD_BYTES) {
      return json({ ok: false, error: "Payload too large", code: "PAYLOAD_TOO_LARGE" }, 413, cors)
    }
    body = JSON.parse(text)
  } catch {
    return json({ ok: false, error: "Invalid JSON", code: "INVALID_INPUT" }, 400, cors)
  }

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : ""
  // UUID shape guard — cheap reject for malformed ids.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) {
    return json({ ok: false, error: "Invalid leadId", code: "INVALID_INPUT" }, 400, cors)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Server misconfigured", code: "CONFIG_ERROR" }, 500, cors)
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── Derive recipient + safe payload from the lead row (never from caller) ───
  const { data: lead, error: leadErr } = await admin
    .schema("vport")
    .from("business_card_leads")
    .select("id, actor_id, name, source, message")
    .eq("id", leadId)
    .maybeSingle()

  if (leadErr) {
    console.error("[publish-lead-notification] lead lookup failed:", leadErr.message)
    return json({ ok: false, error: "Lookup failed", code: "LOOKUP_FAILED" }, 500, cors)
  }

  // No row, or no resolved owner actor → nothing to notify. Do not leak existence.
  if (!lead || !lead.actor_id) {
    return json({ ok: true, skipped: "no_recipient" }, 200, cors)
  }

  const payload = {
    leadName: lead.name ?? null,
    source: lead.source ?? null,
    messagePreview: buildMessagePreview(lead.message),
  }

  // ── Step 1: create the notification event (engine RPC) ──────────────────────
  const { data: eventRow, error: eventErr } = await admin
    .schema("notification")
    .rpc("create_event", {
      p_event_key: "lead_received",
      p_source_domain: "vc",
      p_source_actor_id: null,           // anonymous lead → no source actor
      p_source_user_id: null,
      p_object_domain: "vport",
      p_object_type: "lead",
      p_object_id: String(lead.id),
      p_parent_object_type: null,
      p_parent_object_id: null,
      p_app_id: null,
      p_realm_id: null,
      p_visibility: "private",
      p_payload: payload,
    })
    .single()

  if (eventErr || !eventRow?.id) {
    console.error("[publish-lead-notification] create_event failed:", eventErr?.message)
    return json({ ok: false, error: "Publish failed", code: "EVENT_FAILED" }, 500, cors)
  }

  // ── Step 2: insert the in-app recipient row for the VPORT owner (engine RPC) ─
  const { error: recipErr } = await admin
    .schema("notification")
    .rpc("insert_recipients", {
      p_event_id: eventRow.id,
      p_recipients: [
        {
          recipient_domain: "vc",
          recipient_kind: "actor",
          recipient_actor_id: lead.actor_id,
          recipient_user_id: null,
          recipient_user_app_account_id: null,
          delivery_channel: "in_app",
          inbox_bucket: "default",
          priority: 3,
        },
      ],
    })

  if (recipErr) {
    console.error("[publish-lead-notification] insert_recipients failed:", recipErr.message)
    return json({ ok: false, error: "Publish failed", code: "RECIPIENT_FAILED" }, 500, cors)
  }

  return json({ ok: true, eventId: eventRow.id }, 200, cors)
})
