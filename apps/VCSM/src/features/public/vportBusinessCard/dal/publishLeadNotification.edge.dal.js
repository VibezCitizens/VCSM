import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Notify the owning VPORT actor of a new business-card lead via the server-side
 * bridge Edge Function (publish-lead-notification).
 *
 * Anonymous-safe: business-card visitors have no VCSM session, so the app-layer
 * publishVcsmNotification (session-guarded) cannot publish for them. The Edge
 * Function runs with the service role and derives the recipient from the lead
 * row, so only the lead id is passed here.
 *
 * Best-effort — notification failure must never block lead submission. Returns a
 * structured result (never throws) so a dev capture/debug surface can show WHY
 * the notification fired or failed, instead of a silently swallowed error.
 */
export async function publishLeadNotificationDAL({ leadId }) {
  const fn = "publish-lead-notification";

  if (!leadId) return { ok: false, fn, leadId: null, error: "MISSING_LEAD_ID" };

  try {
    // supabase-js does NOT throw on non-2xx — it returns { data, error }.
    const { data, error } = await supabase.functions.invoke(fn, {
      body: { leadId: String(leadId) },
    });

    if (error) {
      return {
        ok: false,
        fn,
        leadId,
        status: error?.context?.status ?? null,
        error: error?.message ?? String(error),
      };
    }

    return { ok: true, fn, leadId, data: data ?? null };
  } catch (error) {
    // Transport-level failure (network/CORS). Still best-effort — never block.
    return { ok: false, fn, leadId, error: error?.message ?? String(error) };
  }
}
