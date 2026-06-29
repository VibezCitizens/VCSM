import { createClient } from "@supabase/supabase-js";

// Browser-safe write DAL: Traffic ships as a static export, so question
// submission cannot go through a server route handler. It runs in the visitor's
// browser using the public anon key, exactly like the provider-lead capture
// flow (features/conversion/dal/submitProviderLead.write.dal.js).
//
// All editorial-queue invariants (status=draft, is_published=false,
// is_moderated=false, moderation_status=pending), slug generation, and slug
// collision retry are owned by the answers.submit_question SECURITY DEFINER RPC,
// so the anonymous client never controls those columns.

let cachedClient = null;

function getAnswersWriteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `sb-traze-answers-${url.slice(-8)}`
    }
  });

  return cachedClient;
}

export async function createQuestionRow(input) {
  const client = getAnswersWriteClient();
  if (!client) {
    return { data: null, error: new Error("Answers submission is not available.") };
  }

  const { data, error } = await client.schema("answers").rpc("submit_question", {
    p_title: input.title,
    p_body: input.body ?? "",
    p_service_key: input.serviceKey ?? null,
    p_city: input.city ?? null,
    p_region: input.region ?? null,
    p_country: input.country ?? null,
    p_asker_name: input.askerName ?? null,
    p_asker_email: input.askerEmail ?? null
  });

  if (error) {
    return { data: null, error };
  }

  // answers.submit_question RETURNS TABLE, so supabase-js yields an array.
  const row = Array.isArray(data) ? data[0] : data;
  return {
    data: row ?? null,
    error: row ? null : new Error("Question could not be submitted.")
  };
}

// Best-effort confirmation email. Mirrors the provider-lead confirmation flow
// (features/conversion/dal/submitProviderLead.write.dal.js → invokeProviderLeadConfirmation):
// it runs AFTER the question row is committed, only when the asker supplied an
// email, and NEVER throws — a failure here must not affect question submission.
// Invokes the Edge Function by name only (no VCSM app import); Traffic stays
// static-export safe. No delete/remove link is sent (no token RPC exists yet).
export async function invokeQuestionConfirmation({ email, name, title } = {}) {
  if (!email) return false;

  const client = getAnswersWriteClient();
  if (!client) return false;

  try {
    await client.functions.invoke("send-question-confirmation", {
      body: {
        email,
        name: name || undefined,
        title: title || undefined,
        source: "answers"
      }
    });
    return true;
  } catch {
    return false;
  }
}
