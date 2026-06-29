import { supabase } from "@/services/supabase/supabaseClient";

export function sendLeadConfirmationEmailDAL({ leadId }) {
  if (!leadId) return;
  supabase.functions
    .invoke("send-lead-confirmation", {
      body: {
        leadId: String(leadId),
      },
    })
    .catch(() => {
      // fire-and-forget — email failure must never block the lead submission
    });
}
