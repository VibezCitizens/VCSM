import vportSchema from "@/services/supabase/vportClient";

/**
 * Anonymous-safe lead submit via SECURITY DEFINER RPC.
 */
export async function createVportBusinessCardLeadDAL({
  slug,
  name,
  phone,
  email,
  message,
  source = "business_card",
  userAgent = null,
} = {}) {
  const { data, error } = await vportSchema.rpc("submit_business_card_lead", {
    p_slug: String(slug || "").trim().toLowerCase(),
    p_name: String(name || "").trim(),
    p_phone: String(phone || "").trim() || null,
    p_email: String(email || "").trim() || null,
    p_message: String(message || "").trim(),
    p_source: String(source || "business_card").trim() || "business_card",
    p_user_agent: userAgent ? String(userAgent) : null,
    p_ip: null,
  });

  if (error) throw error;
  return data ?? null;
}

export default createVportBusinessCardLeadDAL;
