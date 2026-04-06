import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateOrgMemberBody = {
  organizationId: string;
  displayName: string;
  email: string;
  role?: "owner" | "admin" | "staff" | "teacher";
  password?: string;
  sendInvite?: boolean;
  username?: string | null;
};

type EnsureOrgMemberAccountRow = {
  profile_id: string;
  actor_id: string;
  membership_id: string;
  profile_created: boolean;
  actor_created: boolean;
  membership_created: boolean;
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
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
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
  return `${crypto.randomUUID()}Aa1!`;
}

function isValidOrgRole(
  role: string,
): role is "owner" | "admin" | "staff" | "teacher" {
  return ["owner", "admin", "staff", "teacher"].includes(role);
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
      return json({ error: "Missing required environment variables" }, 500);
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

    const body = (await req.json()) as CreateOrgMemberBody;

    const organizationId = body.organizationId?.trim();
    const displayName = body.displayName?.trim();
    const email = normalizeEmail(body.email ?? "");
    const requestedRole = (body.role ?? "staff").trim().toLowerCase();
    const password = body.password?.trim();
    const sendInvite = Boolean(body.sendInvite);
    const explicitUsername = body.username?.trim() || null;

    if (!organizationId) {
      return json({ error: "organizationId is required" }, 400);
    }

    if (!displayName) {
      return json({ error: "displayName is required" }, 400);
    }

    if (!email) {
      return json({ error: "email is required" }, 400);
    }

    if (!isValidOrgRole(requestedRole)) {
      return json(
        {
          error:
            'Invalid organization role. Allowed roles: "owner", "admin", "staff", "teacher".',
        },
        400,
      );
    }

    const username =
      explicitUsername ??
      slugifyUsername(displayName || email.split("@")[0] || "user");

    // --------------------------------------------------
    // 1) Resolve caller
    // --------------------------------------------------
    const {
      data: { user: callerUser },
      error: callerAuthError,
    } = await userClient.auth.getUser();

    if (callerAuthError || !callerUser) {
      return json({ error: "Unauthorized" }, 401);
    }

    // --------------------------------------------------
    // 2) Resolve caller's learning actor
    // --------------------------------------------------
    const { data: actorOwner, error: callerActorError } = await adminClient
      .schema("learning")
      .from("actor_owners")
      .select("actor_id")
      .eq("user_id", callerUser.id)
      .eq("is_primary", true)
      .eq("is_void", false)
      .limit(1)
      .maybeSingle();

    if (callerActorError) {
      return json(
        {
          error: "Failed to resolve caller learning actor",
          details: callerActorError.message,
        },
        500,
      );
    }

    if (!actorOwner?.actor_id) {
      return json(
        {
          error: "Caller does not have a Learning actor",
        },
        403,
      );
    }

    const callerLearningActorId = actorOwner.actor_id;

    // --------------------------------------------------
    // 3) Authorization
    // caller must be one of:
    //   - platform admin
    //   - organization owner
    //   - org member with role admin/owner/staff
    // --------------------------------------------------
    const { data: platformAdminRow, error: platformAdminError } =
      await adminClient
        .schema("learning")
        .from("platform_admins")
        .select("actor_id")
        .eq("actor_id", callerLearningActorId)
        .limit(1)
        .maybeSingle();

    if (platformAdminError) {
      return json(
        {
          error: "Failed checking platform admin",
          details: platformAdminError.message,
        },
        500,
      );
    }

    let authorized = Boolean(platformAdminRow);

    if (!authorized) {
      const { data: orgRow, error: orgRowError } = await adminClient
        .schema("learning")
        .from("organizations")
        .select("id, owner_actor_id")
        .eq("id", organizationId)
        .limit(1)
        .maybeSingle();

      if (orgRowError) {
        return json(
          {
            error: "Failed checking organization",
            details: orgRowError.message,
          },
          500,
        );
      }

      if (!orgRow) {
        return json({ error: "Organization not found" }, 404);
      }

      if (orgRow.owner_actor_id === callerLearningActorId) {
        authorized = true;
      }

      if (!authorized) {
        const { data: membershipRow, error: membershipError } =
          await adminClient
            .schema("learning")
            .from("organization_memberships")
            .select("role, status")
            .eq("organization_id", organizationId)
            .eq("actor_id", callerLearningActorId)
            .eq("status", "active")
            .in("role", ["admin", "owner", "staff"])
            .limit(1)
            .maybeSingle();

        if (membershipError) {
          return json(
            {
              error: "Failed checking org membership",
              details: membershipError.message,
            },
            500,
          );
        }

        authorized = Boolean(membershipRow);
      }
    }

    if (!authorized) {
      return json({ error: "Forbidden" }, 403);
    }

    // --------------------------------------------------
    // 4) Find auth user by email
    // --------------------------------------------------
    let authUserId: string | null = null;
    let createdNewUser = false;
    let generatedPassword: string | null = null;

    const { data: listedUsers, error: listUsersError } =
      await adminClient.auth.admin.listUsers();

    if (listUsersError) {
      return json(
        {
          error: "Failed listing auth users",
          details: listUsersError.message,
        },
        500,
      );
    }

    const existingAuthUser =
      listedUsers?.users?.find(
        (u) => normalizeEmail(u.email ?? "") === email,
      ) ?? null;

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
    } else {
      generatedPassword = password || generatePassword();

      const { data: createdUserData, error: createUserError } =
        await adminClient.auth.admin.createUser({
          email,
          password: generatedPassword,
          email_confirm: true,
          user_metadata: {
            display_name: displayName,
            username,
          },
        });

      if (createUserError || !createdUserData.user) {
        return json(
          {
            error: "Failed creating auth user",
            details: createUserError?.message ?? "Unknown error",
          },
          500,
        );
      }

      authUserId = createdUserData.user.id;
      createdNewUser = true;
    }

    if (!authUserId) {
      return json({ error: "Unable to resolve auth user" }, 500);
    }

    // --------------------------------------------------
    // 5) Provision Learning identity through RPC
    // --------------------------------------------------
   const { data: rpcData, error: rpcError } = await adminClient
  .schema("learning")
  .rpc("ensure_org_member_account", {
    p_organization_id: organizationId,
    p_auth_user_id: authUserId,
    p_display_name: displayName,
    p_email: email,
    p_username: username,
    p_role: requestedRole,
    p_status: "active",
    p_created_by_actor_id: callerLearningActorId,
  });

    if (rpcError) {
      return json(
        {
          error: "Failed provisioning Learning identity",
          details: rpcError.message,
        },
        500,
      );
    }

    const provisioned = (rpcData as EnsureOrgMemberAccountRow[] | null)?.[0];
    if (!provisioned) {
      return json({ error: "RPC returned no data" }, 500);
    }

    // Set organization_id on actor for tenant scoping
    if (provisioned.actor_id) {
      await adminClient
        .schema("learning")
        .from("actors")
        .update({ organization_id: organizationId })
        .eq("id", provisioned.actor_id);
    }

    // --------------------------------------------------
    // 6) Optional invite
    // Only send invite if a brand-new auth user was created
    // --------------------------------------------------
    let inviteSent = false;
    let inviteError: string | null = null;

    if (sendInvite && createdNewUser) {
      const { error: inviteErr } =
        await adminClient.auth.admin.inviteUserByEmail(email, {
          data: {
            display_name: displayName,
            username,
          },
        });

      if (inviteErr) {
        inviteError = inviteErr.message;
      } else {
        inviteSent = true;
      }
    }

    return json({
      authUserId,
      createdNewUser,
      generatedPassword: createdNewUser && !password ? generatedPassword : null,
      inviteSent,
      inviteError,
      profileId: provisioned.profile_id,
      actorId: provisioned.actor_id,
      membershipId: provisioned.membership_id,
      profileCreated: provisioned.profile_created,
      actorCreated: provisioned.actor_created,
      membershipCreated: provisioned.membership_created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});