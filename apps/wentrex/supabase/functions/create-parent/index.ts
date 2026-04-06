import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateParentBody = {
  organizationId: string;
  studentActorId: string;
  displayName: string;
  email: string;
  relationship?: string;
  isPrimary?: boolean;
  password?: string;
  sendInvite?: boolean;
  username?: string | null;
};

type EnsureParentAccountRow = {
  out_profile_id: string;
  out_actor_id: string;
  out_profile_created: boolean;
  out_actor_created: boolean;
};

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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function slugifyUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

function generatePassword(): string {
  return `${crypto.randomUUID().slice(0, 8)}Aa1!`;
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
      return json({ error: "Missing environment variables" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = (await req.json()) as CreateParentBody;

    const organizationId = body.organizationId?.trim();
    const studentActorId = body.studentActorId?.trim();
    const displayName = body.displayName?.trim();
    const email = normalizeEmail(body.email ?? "");
    const relationship = body.relationship?.trim() || "parent";
    const isPrimary = Boolean(body.isPrimary);
    const password = body.password?.trim();
    const sendInvite = Boolean(body.sendInvite);
    const explicitUsername = body.username?.trim() || null;

    if (!organizationId) return json({ error: "organizationId is required" }, 400);
    if (!studentActorId) return json({ error: "studentActorId is required" }, 400);
    if (!displayName) return json({ error: "displayName is required" }, 400);
    if (!email) return json({ error: "email is required" }, 400);

    const username = explicitUsername ?? slugifyUsername(displayName || email.split("@")[0] || "parent");

    // ── 1. Resolve caller ─────────────────────────────────────────────
    const { data: { user: callerUser }, error: callerErr } = await userClient.auth.getUser();
    if (callerErr || !callerUser) return json({ error: "Unauthorized" }, 401);

    const { data: callerActor } = await adminClient
      .schema("learning").from("actor_owners")
      .select("actor_id")
      .eq("user_id", callerUser.id).eq("is_primary", true).eq("is_void", false)
      .limit(1).maybeSingle();

    if (!callerActor?.actor_id) return json({ error: "Caller has no Learning actor" }, 403);
    const callerActorId = callerActor.actor_id;

    // ── 2. Authorization ──────────────────────────────────────────────
    const { data: orgRow } = await adminClient
      .schema("learning").from("organizations")
      .select("id, owner_actor_id")
      .eq("id", organizationId).limit(1).maybeSingle();

    if (!orgRow) return json({ error: "Organization not found" }, 404);

    let authorized = orgRow.owner_actor_id === callerActorId;

    if (!authorized) {
      const { data: pa } = await adminClient.schema("learning").from("platform_admins")
        .select("actor_id").eq("actor_id", callerActorId).limit(1).maybeSingle();
      authorized = Boolean(pa);
    }

    if (!authorized) {
      const { data: mem } = await adminClient.schema("learning").from("organization_memberships")
        .select("role").eq("organization_id", organizationId).eq("actor_id", callerActorId)
        .eq("status", "active").in("role", ["admin", "owner", "staff"]).limit(1).maybeSingle();
      authorized = Boolean(mem);
    }

    if (!authorized) return json({ error: "Forbidden" }, 403);

    // ── 3. Validate student exists in this org ────────────────────────
    const { data: studentActor } = await adminClient
      .schema("learning").from("actors")
      .select("id, organization_id")
      .eq("id", studentActorId).eq("organization_id", organizationId).maybeSingle();

    if (!studentActor) return json({ error: "Student not found in this organization" }, 404);

    // ── 4. Check max 2 parents ────────────────────────────────────────
    const { count: linkCount } = await adminClient
      .schema("learning").from("parent_student_links")
      .select("id", { count: "exact", head: true })
      .eq("student_actor_id", studentActorId);

    if ((linkCount ?? 0) >= 2) {
      return json({ error: "This student already has 2 linked parents" }, 400);
    }

    // ── 5. Find or create auth user ───────────────────────────────────
    let authUserId: string | null = null;
    let createdNewUser = false;
    let generatedPassword: string | null = null;

    const { data: listedUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = listedUsers?.users?.find(
      (u) => normalizeEmail(u.email ?? "") === email,
    ) ?? null;

    if (existingUser) {
      authUserId = existingUser.id;
    } else {
      generatedPassword = password || generatePassword();
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: { display_name: displayName, username },
      });

      if (createErr || !created.user) {
        return json({ error: "Failed creating auth user", details: createErr?.message }, 500);
      }
      authUserId = created.user.id;
      createdNewUser = true;
    }

    if (!authUserId) return json({ error: "Unable to resolve auth user" }, 500);

 // ── 6. Provision parent identity via RPC ──────────────────────────
const { data: rpcData, error: rpcError } = await adminClient
  .schema("learning")
  .rpc("ensure_parent_account", {
    p_auth_user_id: authUserId,
    p_display_name: displayName,
    p_email: email,
    p_username: username,
    p_created_by_actor_id: callerActorId,
    p_organization_id: organizationId,
  });

if (rpcError) {
  return json(
    {
      error: "Failed provisioning parent identity",
      details: rpcError.message,
    },
    500,
  );
}

const provisioned = (rpcData as EnsureParentAccountRow[] | null)?.[0];

if (!provisioned?.out_actor_id) {
  return json({ error: "RPC returned no actor_id" }, 500);
}

const parentActorId = provisioned.out_actor_id;


    // ── 7. Create parent profile ──────────────────────────────────────
    await adminClient.schema("learning").from("actor_profiles").upsert({
      actor_id: parentActorId,
      full_name: displayName,
      relationship_to_student: relationship,
    }, { onConflict: "actor_id" });

    // ── 7.5. Create parent identity sidecar ───────────────────────────
await adminClient
  .schema("learning")
  .from("actor_identities")
  .upsert(
    {
      actor_id: parentActorId,
      login_id: null,
      synthetic_email: null,
      parent_email: email,
      parent_name: displayName,
      must_change_password: false,
      is_school_managed: false,
      organization_id: organizationId,
    },
    { onConflict: "actor_id" },
  );

    // ── 8. Create parent-student link ─────────────────────────────────
    const { data: link, error: linkErr } = await adminClient
      .schema("learning").from("parent_student_links")
      .insert({
        organization_id: organizationId,
        parent_actor_id: parentActorId,
        student_actor_id: studentActorId,
        relationship,
        is_primary: isPrimary,
        created_by_actor_id: callerActorId,
      })
      .select("id")
      .single();

    if (linkErr) {
      if (linkErr.message?.includes("duplicate") || linkErr.message?.includes("unique")) {
        return json({ error: "This parent is already linked to this student" }, 400);
      }
      return json({ error: "Failed creating parent-student link", details: linkErr.message }, 500);
    }

    // ── 9. Optional invite ────────────────────────────────────────────
    let inviteSent = false;
    let inviteError: string | null = null;

    if (sendInvite && createdNewUser) {
      const { error: invErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName, username },
      });
      if (invErr) { inviteError = invErr.message; } else { inviteSent = true; }
    }

    // ── 10. Return ────────────────────────────────────────────────────
    return json({
  authUserId,
  createdNewUser,
  generatedPassword: createdNewUser && !password ? generatedPassword : null,
  inviteSent,
  inviteError,
  parentActorId,
  studentActorId,
  linkId: link.id,
  relationship,
  profileId: provisioned.out_profile_id,
  organizationId,
});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
