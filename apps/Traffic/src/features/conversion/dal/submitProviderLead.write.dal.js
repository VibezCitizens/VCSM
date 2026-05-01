import { createClient } from "@supabase/supabase-js";

let cachedClient = null;
let cachedClientKey = "";

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveClientConfig(config = {}) {
  return {
    url: toText(config.supabaseUrl) || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: toText(config.supabaseAnonKey) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  };
}

function getProviderLeadClient(config = {}) {
  const { url, anonKey } = resolveClientConfig(config);
  if (!url || !anonKey) return null;

  const clientKey = `${url}:${anonKey.slice(-8)}`;
  if (cachedClient && cachedClientKey === clientKey) {
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `sb-traze-lead-${url.slice(-8)}`
    }
  });
  cachedClientKey = clientKey;
  return cachedClient;
}

export async function readProviderLeadSessionUser(config = {}) {
  const client = getProviderLeadClient(config);
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
}

export async function submitProviderLeadRow({ config = {}, lead }) {
  const client = getProviderLeadClient(config);
  if (!client) {
    throw new Error("PROVIDER_LEAD_CLIENT_UNAVAILABLE");
  }

  const { error } = await client.schema("vport").rpc("submit_business_card_lead", {
    p_slug: lead.providerSlug,
    p_name: lead.name,
    p_phone: lead.phone,
    p_email: lead.email,
    p_message: lead.message,
    p_source: "directory",
    p_user_agent: lead.userAgent,
    p_ip: null
  });

  if (error) throw error;
}

export async function invokeProviderLeadConfirmation({ config = {}, lead }) {
  if (!lead.email) return false;

  const client = getProviderLeadClient(config);
  if (!client) return false;

  try {
    await client.functions.invoke("send-lead-confirmation", {
      body: {
        email: lead.email,
        name: lead.name,
        vportName: lead.providerName || undefined,
        providerProfileUrl: lead.profileHref || undefined,
        source: "directory"
      }
    });
    return true;
  } catch {
    return false;
  }
}
