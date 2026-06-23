import { createClient } from "@supabase/supabase-js";

// Browser-safe public read. Traffic ships as a static export, so published
// questions are fetched at runtime in the visitor's browser using the public
// anon key (same pattern as questions.write.dal.js).
//
// The answers.list_published_questions() RPC returns ONLY public fields and
// never exposes asker_email, moderation_note, or moderated_by_actor_id.

let cachedClient = null;

function getAnswersReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `sb-traze-answers-read-${url.slice(-8)}`
    }
  });

  return cachedClient;
}

// Always resolves (never throws) so the public page degrades gracefully:
// returns { data: [], error } when the client/env/RPC is unavailable.
export async function listPublishedQuestions() {
  const client = getAnswersReadClient();
  if (!client) {
    return { data: [], error: new Error("Answers reads are not available.") };
  }

  const { data, error } = await client.schema("answers").rpc("list_published_questions");
  if (error) {
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}
