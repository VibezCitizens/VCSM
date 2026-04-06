import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Server configuration error" }, 500);
    }

    const body = await req.json();
    const loginId = body.loginId?.trim();
    const password = body.password;

    // ── Validate input ──────────────────────────────────────────────
    if (!loginId || !password) {
      return json({ error: "Invalid login ID or password." }, 401);
    }

    // Basic login_id format check (7-digit number)
    if (!/^\d{7}$/.test(loginId)) {
      return json({ error: "Invalid login ID or password." }, 401);
    }

    // ── Server-side privileged client ───────────────────────────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── Step 1: Resolve login_id → synthetic_email (server-side only) ──
    const { data: identity, error: identityErr } = await adminClient
      .schema("learning")
      .from("actor_identities")
      .select("synthetic_email, must_change_password, actor_id")
      .eq("login_id", loginId)
      .maybeSingle();

    if (identityErr || !identity?.synthetic_email) {
      // Generic error — don't leak whether login_id exists
      return json({ error: "Invalid login ID or password." }, 401);
    }

    // ── Step 2: Check actor is active ───────────────────────────────
    const { data: actor } = await adminClient
      .schema("learning")
      .from("actors")
      .select("id, is_active")
      .eq("id", identity.actor_id)
      .maybeSingle();

    if (!actor || !actor.is_active) {
      return json({ error: "Invalid login ID or password." }, 401);
    }

    // ── Step 3: Authenticate with Supabase Auth ─────────────────────
    // Use an anon client to sign in — this creates a proper session
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });

    const { data: authData, error: authErr } =
      await anonClient.auth.signInWithPassword({
        email: identity.synthetic_email,
        password,
      });

    if (authErr || !authData?.session) {
      return json({ error: "Invalid login ID or password." }, 401);
    }

    // ── Step 4: Return session + flags ──────────────────────────────
    // Return the session so the frontend can set it.
    // Do NOT return synthetic_email — it's an internal detail.
    return json({
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        expires_at: authData.session.expires_at,
        token_type: authData.session.token_type,
      },
      must_change_password: identity.must_change_password ?? false,
    });
  } catch (error) {
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
