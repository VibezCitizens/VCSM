import { supabase } from "@/services/supabase/supabaseClient";

export function sendLeadConfirmationEmailDAL({ email, name, vportName, providerProfileUrl, source }) {
  if (!email) return;
  supabase.functions
    .invoke("send-lead-confirmation", {
      body: {
        email,
        name,
        vportName,
        providerProfileUrl: providerProfileUrl || undefined,
        source: source || "vport_card",
      },
    })
    .catch(() => {
      // fire-and-forget — email failure must never block the lead submission
    });
}
