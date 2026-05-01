// supabase/functions/send-push-notification/index.ts
//
// TODO: Implement OneSignal push delivery.
//
// Required Supabase secrets (set via `supabase secrets set`):
//   ONESIGNAL_APP_ID       — same value as VITE_ONESIGNAL_APP_ID (safe to duplicate server-side)
//   ONESIGNAL_REST_API_KEY — secret REST key from OneSignal dashboard > Settings > Keys & IDs
//                            NEVER expose this in frontend code or env files committed to git
//
// Implementation plan:
//
//   1. Accept POST body: { user_id, actor_id?, title, body, url?, data? }
//   2. Verify caller has service_role or is an internal edge function (no public exposure)
//   3. Look up onesignal_user_id from notification.push_subscriptions for the target user/actor
//   4. POST to OneSignal Create Message API:
//        https://api.onesignal.com/notifications
//        Authorization: Basic <ONESIGNAL_REST_API_KEY>
//        {
//          app_id: ONESIGNAL_APP_ID,
//          target_channel: "push",
//          include_aliases: { external_id: [<externalId>] },
//          headings: { en: title },
//          contents: { en: body },
//          url,
//          data,
//        }
//   5. Return { ok: true, notification_id } or { ok: false, code, message }
//
// Actor-specific targeting:
//   Use `include_aliases` with the user's `external_id` (Supabase auth user ID) for delivery.
//   VPORT-scoped targeting (e.g. send only to vport owners) is handled via:
//     - OneSignal Data Tags (set tags per actor on subscription)
//     - OR backend filtering in this function before calling the OneSignal API
//   Do NOT use multiple external_ids per user — one stable auth ID per subscription.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // TODO: Remove this stub and implement the full function above.
  return json({ ok: false, code: "NOT_IMPLEMENTED" }, 501);
});
