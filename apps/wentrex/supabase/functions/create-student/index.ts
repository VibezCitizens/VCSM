import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateStudentBody = {
  organizationId: string;
  courseIds: string[];
  displayName: string;
  parentName?: string | null;
  parentEmail?: string | null;
  password?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generatePassword(): string {
  return `${crypto.randomUUID().slice(0, 8)}Aa1!`;
}

function errMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
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
      return json(
        {
          error: "Missing environment variables",
          hasUrl: Boolean(supabaseUrl),
          hasAnonKey: Boolean(anonKey),
          hasServiceRoleKey: Boolean(serviceRoleKey),
        },
        500,
      );
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

    const body = (await req.json()) as CreateStudentBody;

    const organizationId = body.organizationId?.trim();
    const courseIds = (body.courseIds ?? [])
      .map((id: string) => id?.trim())
      .filter(Boolean);
    const displayName = body.displayName?.trim();
    const parentName = body.parentName?.trim() || null;
    const parentEmail = body.parentEmail?.trim().toLowerCase() || null;
    const password = body.password?.trim() || null;

    if (!organizationId) {
      return json({ error: "organizationId is required" }, 400);
    }

    if (!displayName) {
      return json({ error: "displayName is required" }, 400);
    }

    // 1) Resolve caller
    const {
      data: { user: callerUser },
      error: callerErr,
    } = await userClient.auth.getUser();

    if (callerErr || !callerUser) {
      return json(
        {
          error: "Unauthorized",
          details: callerErr?.message ?? "No authenticated user",
        },
        401,
      );
    }

    const { data: callerActor, error: callerActorErr } = await adminClient
      .schema("learning")
      .from("actor_owners")
      .select("actor_id")
      .eq("user_id", callerUser.id)
      .eq("is_primary", true)
      .eq("is_void", false)
      .limit(1)
      .maybeSingle();

    if (callerActorErr) {
      return json(
        {
          error: "Failed resolving caller actor",
          details: callerActorErr.message,
          callerUserId: callerUser.id,
        },
        500,
      );
    }

    if (!callerActor?.actor_id) {
      return json(
        {
          error: "Caller has no Learning actor",
          callerUserId: callerUser.id,
        },
        403,
      );
    }

    const callerActorId = callerActor.actor_id;

    // 2) Authorization
    const { data: orgRow, error: orgErr } = await adminClient
      .schema("learning")
      .from("organizations")
      .select("id, owner_actor_id, realm_id")
      .eq("id", organizationId)
      .limit(1)
      .maybeSingle();

    if (orgErr) {
      return json(
        {
          error: "Failed loading organization",
          details: orgErr.message,
          organizationId,
        },
        500,
      );
    }

    if (!orgRow) {
      return json({ error: "Organization not found", organizationId }, 404);
    }

    let authorized = orgRow.owner_actor_id === callerActorId;

    if (!authorized) {
      const { data: platformAdmin, error: platformAdminErr } = await adminClient
        .schema("learning")
        .from("platform_admins")
        .select("actor_id")
        .eq("actor_id", callerActorId)
        .limit(1)
        .maybeSingle();

      if (platformAdminErr) {
        return json(
          {
            error: "Failed checking platform admin status",
            details: platformAdminErr.message,
            callerActorId,
          },
          500,
        );
      }

      authorized = Boolean(platformAdmin);
    }

    if (!authorized) {
      const { data: membership, error: membershipErr } = await adminClient
        .schema("learning")
        .from("organization_memberships")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("actor_id", callerActorId)
        .eq("status", "active")
        .in("role", ["admin", "owner", "staff"])
        .limit(1)
        .maybeSingle();

      if (membershipErr) {
        return json(
          {
            error: "Failed checking organization membership",
            details: membershipErr.message,
            callerActorId,
            organizationId,
          },
          500,
        );
      }

      authorized = Boolean(membership);
    }

    if (!authorized) {
      return json(
        {
          error: "Forbidden",
          callerActorId,
          organizationId,
        },
        403,
      );
    }

    // 3) Validate courses belong to this org
    let validCourseIds: string[] = [];

    if (courseIds.length > 0) {
      const { data: validCourses, error: validCoursesErr } = await adminClient
        .schema("learning")
        .from("courses")
        .select("id")
        .eq("organization_id", organizationId)
        .in("id", courseIds);

      if (validCoursesErr) {
        return json(
          {
            error: "Failed validating courses",
            details: validCoursesErr.message,
            organizationId,
            courseIds,
          },
          500,
        );
      }

      validCourseIds = (validCourses ?? []).map((c: { id: string }) => c.id);
    }

    // 4) Generate student login ID
    const { data: loginId, error: loginIdErr } = await adminClient
      .schema("learning")
      .rpc("generate_student_login_id");

    if (loginIdErr || !loginId) {
      return json(
        {
          error: "Failed generating student login ID",
          details: loginIdErr?.message ?? "No ID returned",
        },
        500,
      );
    }

    const syntheticEmail = `s${loginId}@school.internal`;
    const generatedPassword = password || generatePassword();

    // 5) Create auth user
    const { data: createdUser, error: createUserErr } =
      await adminClient.auth.admin.createUser({
        email: syntheticEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          login_id: loginId,
          is_school_managed: true,
        },
      });

    if (createUserErr || !createdUser.user) {
      return json(
        {
          error: "Failed creating auth user",
          details: createUserErr?.message ?? "Unknown",
          syntheticEmail,
          loginId,
        },
        500,
      );
    }

    const authUserId = createdUser.user.id;

    // 6) Provision learning identity
// 6) Create student actor directly (student is NOT an org member)

const { data: actorRow, error: actorErr } = await adminClient
  .schema("learning")
  .from("actors")
  .insert({
    user_id: authUserId,
    organization_id: organizationId,
    is_active: true,
  })
  .select("id, profile_id")
  .single();

if (actorErr || !actorRow) {
  return json(
    {
      error: "Failed creating student actor",
      details: actorErr?.message ?? "Unknown error",
      organizationId,
      authUserId,
    },
    500,
  );
}

const studentActorId = actorRow.id;

    // 7) 

    // 8) Create actor_identities record
    const { error: identityErr } = await adminClient
      .schema("learning")
      .from("actor_identities")
      .upsert(
        {
          actor_id: studentActorId,
          login_id: loginId,
          synthetic_email: syntheticEmail,
          parent_email: parentEmail,
          parent_name: parentName,
          must_change_password: true,
          is_school_managed: true,
          organization_id: organizationId,
        },
        { onConflict: "actor_id" },
      );

    if (identityErr) {
      return json(
        {
          error: "Failed creating identity record",
          details: identityErr.message,
          studentActorId,
        },
        500,
      );
    }

    // 9) Create actor_profiles record
    const { error: profileErr } = await adminClient
      .schema("learning")
      .from("actor_profiles")
      .upsert(
        {
          actor_id: studentActorId,
          full_name: displayName,
          student_id: loginId,
        },
        { onConflict: "actor_id" },
      );

    if (profileErr) {
      return json(
        {
          error: "Failed creating actor profile",
          details: profileErr.message,
          studentActorId,
        },
        500,
      );
    }

    // 10) Grant actor_access
    const { error: accessErr } = await adminClient
      .schema("learning")
      .from("actor_access")
      .upsert(
        {
          actor_id: studentActorId,
          can_access_learning_center: true,
        },
        { onConflict: "actor_id" },
      );

    if (accessErr) {
      return json(
        {
          error: "Failed granting actor access",
          details: accessErr.message,
          studentActorId,
        },
        500,
      );
    }

    // 11) Enroll in courses
    if (validCourseIds.length > 0) {
      const membershipRows = validCourseIds.map((courseId: string) => ({
        course_id: courseId,
        actor_id: studentActorId,
        role: "student",
        status: "active",
        created_by_actor_id: callerActorId,
        organization_id: organizationId,
      }));

      const { error: enrollErr } = await adminClient
        .schema("learning")
        .from("course_memberships")
        .upsert(membershipRows, {
          onConflict: "course_id,actor_id,role",
          ignoreDuplicates: true,
        });

      if (enrollErr) {
        return json(
          {
            error: "Failed enrolling in courses",
            details: enrollErr.message,
            membershipRows,
          },
          500,
        );
      }
    }

    return json({
      authUserId,
      studentActorId,
      loginId,
      syntheticEmail,
      generatedPassword,
      parentName,
      parentEmail,
      mustChangePassword: true,
      enrolledCourses: validCourseIds.length,
      profileId: actorRow?.profile_id ?? null,
      organizationId,
    });
  } catch (error) {
    return json(
      {
        error: "Unhandled exception",
        details: errMessage(error),
      },
      500,
    );
  }
});