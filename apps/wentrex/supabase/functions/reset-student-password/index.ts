import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Missing environment variables" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    // User client — for auth context
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client — for service_role operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const targetActorId: string = body.actorId?.trim();
    const newPassword: string = body.newPassword?.trim();
    const requireChange: boolean = body.requirePasswordChange ?? true;

    if (!targetActorId) return json({ error: "actorId is required" }, 400);
    if (!newPassword) return json({ error: "newPassword is required" }, 400);
    if (newPassword.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

    // ── 1. Resolve caller ─────────────────────────────────────────────
    const { data: { user: callerUser }, error: callerErr } = await userClient.auth.getUser();
    if (callerErr || !callerUser) return json({ error: "Unauthorized" }, 401);

    // Resolve caller actor
    const { data: callerActor } = await adminClient.schema("learning").from("actor_owners")
      .select("actor_id")
      .eq("user_id", callerUser.id).eq("is_primary", true).eq("is_void", false)
      .limit(1).maybeSingle();

    if (!callerActor?.actor_id) return json({ error: "Caller has no Learning actor" }, 403);
    const callerActorId = callerActor.actor_id;

    // ── 2. Authorization — admin/owner/staff/teacher ──────────────────
    const { data: callerMemberships } = await adminClient.schema("learning")
      .from("organization_memberships")
      .select("role").eq("actor_id", callerActorId).eq("status", "active");

    const callerRoles = new Set((callerMemberships ?? []).map((m: any) => m.role));
    const isAuthorized = callerRoles.has("owner") || callerRoles.has("admin") ||
                         callerRoles.has("staff") || callerRoles.has("teacher");

    if (!isAuthorized) {
      // Also check platform admin
      const { data: pa } = await adminClient.schema("learning").from("platform_admins")
        .select("actor_id").eq("actor_id", callerActorId).limit(1).maybeSingle();
      if (!pa) return json({ error: "Forbidden — insufficient role" }, 403);
    }

    // ── 3. Resolve target actor → auth user ───────────────────────────
    // CRITICAL MAPPING: learning.actors.id → learning.actors.user_id → auth.users.id
    const { data: targetActor } = await adminClient.schema("learning").from("actors")
      .select("id, user_id, organization_id, is_active")
      .eq("id", targetActorId).maybeSingle();

    if (!targetActor) return json({ error: "Target actor not found" }, 404);
    if (!targetActor.user_id) return json({ error: "Target actor has no auth user link" }, 500);
    if (!targetActor.is_active) return json({ error: "Target actor is inactive" }, 400);

    const targetAuthUserId = targetActor.user_id;
    // targetAuthUserId is the auth.users.id — this is what Supabase Auth API needs

    // ── 4. Update password via Supabase Auth Admin API ────────────────
    // This changes the REAL authentication password in auth.users
    // NOT the learning.actor_identities table
    const { error: passwordErr } = await adminClient.auth.admin.updateUserById(
      targetAuthUserId,
      { password: newPassword }
    );

    if (passwordErr) {
      return json({
        error: "Failed to update password",
        details: passwordErr.message,
      }, 500);
    }

    // ── 5. Update must_change_password flag in actor_identities ───────
    // This is a UI/business flag — it does NOT store the password
    if (requireChange) {
      await adminClient.schema("learning").from("actor_identities")
        .update({
          must_change_password: true,
          updated_at: new Date().toISOString(),
        })
        .eq("actor_id", targetActorId);
    } else {
      await adminClient.schema("learning").from("actor_identities")
        .update({
          must_change_password: false,
          updated_at: new Date().toISOString(),
        })
        .eq("actor_id", targetActorId);
    }

    // ── 6. Audit log ──────────────────────────────────────────────────
    await adminClient.schema("learning").from("audit_log").insert({
      entity_type: "student_password",
      entity_id: targetActorId,
      action: "password_reset",
      actor_id: callerActorId,
      meta: {
        target_actor_id: targetActorId,
        target_user_id: targetAuthUserId,
        require_password_change: requireChange,
        reset_by: callerUser.email,
      },
    });

    return json({
      ok: true,
      actorId: targetActorId,
      authUserId: targetAuthUserId,
      requirePasswordChange: requireChange,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
