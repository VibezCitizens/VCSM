import { supabase } from "@/lib/supabaseClient"; // your actual path
import { getOrCreateWandersClientKey } from "@/features/wanders/lib/wandersClientKey";

export async function sendCardViaDropLink(input) {
  const clientKey = getOrCreateWandersClientKey();

  const { dropPublicId, templateKey, messageText, customization } = input;

  const { data, error } = await supabase.rpc("drop_send_card", {
    p_drop_public_id: dropPublicId,
    p_client_key: clientKey,
    p_template_key: templateKey,
    p_message_text: messageText ?? null,
    p_customization: customization ?? {},
  });

  if (error) throw error;
  return data;
}
