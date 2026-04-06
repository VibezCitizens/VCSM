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

function generatePassword(): string {
  return `${crypto.randomUUID().slice(0, 8)}Aa1!`;
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const studentActorId: string = body.studentActorId?.trim();
    if (!studentActorId) return json({ error: "studentActorId is required" }, 400);

    // 1. Verify caller
    const { data: { user: callerUser }, error: callerErr } = await userClient.auth.getUser();
    if (callerErr || !callerUser) return json({ error: "Unauthorized" }, 401);

    const { data: callerActor } = await adminClient.schema("learning").from("actors")
      .select("id").eq("user_id", callerUser.id).eq("is_active", true).maybeSingle();
    if (!callerActor) return json({ error: "Caller has no Learning actor" }, 403);

    // 2. Verify parent-student link
    const { data: link } = await adminClient.schema("learning").from("parent_student_links")
      .select("id, relationship")
      .eq("parent_actor_id", callerActor.id)
      .eq("student_actor_id", studentActorId)
      .maybeSingle();
    if (!link) return json({ error: "You are not linked as a parent to this student" }, 403);

    // 3. Get student identity
    const { data: identity } = await adminClient.schema("learning").from("actor_identities")
      .select("actor_id, is_school_managed, login_id")
      .eq("actor_id", studentActorId).maybeSingle();
    if (!identity) return json({ error: "Student identity not found" }, 404);
    if (!identity.is_school_managed) return json({ error: "Not a school-managed account" }, 400);

    // 4. Get student auth user
    const { data: studentActor } = await adminClient.schema("learning").from("actors")
      .select("user_id").eq("id", studentActorId).maybeSingle();
    if (!studentActor?.user_id) return json({ error: "Student auth account not found" }, 404);

    // 5. Generate and set new password
    const newPassword = generatePassword();

    const { error: pwdErr } = await adminClient.auth.admin.updateUserById(
      studentActor.user_id,
      { password: newPassword }
    );
    if (pwdErr) return json({ error: "Failed to reset password", details: pwdErr.message }, 500);

    // 6. Set must_change_password
    await adminClient.schema("learning").from("actor_identities")
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq("actor_id", studentActorId);

    // 7. Audit log
    await adminClient.schema("learning").from("audit_log").insert({
      entity_type: "student_password",
      entity_id: studentActorId,
      action: "parent_password_reset",
      actor_id: callerActor.id,
      meta: {
        student_actor_id: studentActorId,
        student_login_id: identity.login_id,
        parent_relationship: link.relationship,
        requested_by: callerUser.email,
      },
    });

    return json({
      ok: true,
      loginId: identity.login_id,
      temporaryPassword: newPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
