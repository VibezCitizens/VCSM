import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateParentBody = {
  organizationId: string;
  courseId: string;
  studentActorId: string;
  displayName: string;
  email: string;
  password?: string;
  sendInvite?: boolean;
  username?: string | null;
};

type EnsureParentAccountRow = {
  profile_id: string;
  actor_id: string;
  profile_created: boolean;
  actor_created: boolean;
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

    const body = (await req.json()) as CreateParentBody;

    const organizationId = body.organizationId?.trim();
    const courseId = body.courseId?.trim();
    const studentActorId = body.studentActorId?.trim();
    const displayName = body.displayName?.trim();
    const email = normalizeEmail(body.email ?? "");
    const password = body.password?.trim();
    const sendInvite = Boolean(body.sendInvite);
    const explicitUsername = body.username?.trim() || null;

    if (!organizationId) {
      return json({ error: "organizationId is required" }, 400);
    }

    if (!courseId) {
      return json({ error: "courseId is required" }, 400);
    }

    if (!studentActorId) {
      return json({ error: "studentActorId is required" }, 400);
    }

    if (!displayName) {
      return json({ error: "displayName is required" }, 400);
    }

    if (!email) {
      return json({ error: "email is required" }, 400);
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
    // 4) Validate: course belongs to org
    // --------------------------------------------------
    const { data: courseRow, error: courseError } = await adminClient
      .schema("learning")
      .from("courses")
      .select("id, organization_id")
      .eq("id", courseId)
      .limit(1)
      .maybeSingle();

    if (courseError) {
      return json(
        {
          error: "Failed checking course",
          details: courseError.message,
        },
        500,
      );
    }

    if (!courseRow) {
      return json({ error: "Course not found" }, 404);
    }

    if (courseRow.organization_id !== organizationId) {
      return json(
        { error: "Course does not belong to the specified organization" },
        400,
      );
    }

    // --------------------------------------------------
    // 5) Validate: student actor exists
    // --------------------------------------------------
    const { data: studentActorRow, error: studentActorError } =
      await adminClient
        .schema("learning")
        .from("actors")
        .select("id")
        .eq("id", studentActorId)
        .limit(1)
        .maybeSingle();

    if (studentActorError) {
      return json(
        {
          error: "Failed checking student actor",
          details: studentActorError.message,
        },
        500,
      );
    }

    if (!studentActorRow) {
      return json({ error: "Student actor not found" }, 404);
    }

    // --------------------------------------------------
    // 6) Validate: student is enrolled in course
    // --------------------------------------------------
    const { data: studentEnrollment, error: studentEnrollmentError } =
      await adminClient
        .schema("learning")
        .from("course_memberships")
        .select("id")
        .eq("course_id", courseId)
        .eq("actor_id", studentActorId)
        .eq("role", "student")
        .limit(1)
        .maybeSingle();

    if (studentEnrollmentError) {
      return json(
        {
          error: "Failed checking student enrollment",
          details: studentEnrollmentError.message,
        },
        500,
      );
    }

    if (!studentEnrollment) {
      return json(
        { error: "Student is not enrolled in the specified course" },
        400,
      );
    }

    // --------------------------------------------------
    // 7) Find auth user by email
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
    // 8) Provision Learning identity through RPC
    //    (no org membership — parents are not org members)
    // --------------------------------------------------
    const { data: rpcData, error: rpcError } = await adminClient
      .schema("learning")
      .rpc("ensure_parent_account", {
        p_auth_user_id: authUserId,
        p_display_name: displayName,
        p_email: email,
        p_username: username,
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

    const provisioned = (rpcData as EnsureParentAccountRow[] | null)?.[0];
    if (!provisioned) {
      return json({ error: "RPC returned no data" }, 500);
    }

    // --------------------------------------------------
    // 9) Create course_memberships row with role='parent'
    // --------------------------------------------------
    const { data: membershipRow, error: membershipInsertError } =
      await adminClient
        .schema("learning")
        .from("course_memberships")
        .insert({
          course_id: courseId,
          actor_id: provisioned.actor_id,
          role: "parent",
          created_by_actor_id: callerLearningActorId,
        })
        .select("id, role")
        .single();

    if (membershipInsertError) {
      return json(
        {
          error: "Failed creating course membership",
          details: membershipInsertError.message,
        },
        500,
      );
    }

    // --------------------------------------------------
    // 10) Create observer_student_links row
    // --------------------------------------------------
    const { data: observerLink, error: observerLinkError } = await adminClient
      .schema("learning")
      .from("observer_student_links")
      .insert({
        observer_actor_id: provisioned.actor_id,
        student_actor_id: studentActorId,
        created_by_actor_id: callerLearningActorId,
      })
      .select("id")
      .single();

    if (observerLinkError) {
      return json(
        {
          error: "Failed creating observer-student link",
          details: observerLinkError.message,
        },
        500,
      );
    }

    // --------------------------------------------------
    // 11) Optional invite
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
      membershipId: membershipRow.id,
      membershipRole: membershipRow.role,
      observerLinkId: observerLink.id,
      studentActorId,
      profileCreated: provisioned.profile_created,
      actorCreated: provisioned.actor_created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
