import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateTenantBody = {
  principalEmail: string;
  principalName?: string;
  schoolName: string;
  schoolSlug?: string | null;
  primaryColor?: string | null;
};

type CreateTenantBootstrapRow = {
  principal_actor_id: string;
  realm_id: string;
  organization_id: string;
  membership_id: string;
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

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function generateTempPassword(length = 20): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
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

    // Caller-scoped client: used for auth.getUser() only
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client: used for auth.admin ops and RPC execution
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = (await req.json()) as CreateTenantBody;

    const principalEmail = normalizeEmail(body.principalEmail ?? "");
    const principalName = body.principalName?.trim() ?? "";
    const schoolName = body.schoolName?.trim() ?? "";
    const schoolSlug = body.schoolSlug?.trim() || null;
    const primaryColor = body.primaryColor?.trim() || "#0f4a72";

    if (!principalEmail) {
      return json({ error: "principalEmail is required" }, 400);
    }

    if (!schoolName) {
      return json({ error: "schoolName is required" }, 400);
    }

    // --------------------------------------------------
    // 1) Resolve caller identity
    // --------------------------------------------------
    const {
      data: { user: callerUser },
      error: callerAuthError,
    } = await callerClient.auth.getUser();

    if (callerAuthError || !callerUser) {
      return json({ error: "Unauthorized" }, 401);
    }

    // --------------------------------------------------
    // 2) Verify caller is a platform owner
    // Uses learning.is_platform_owner — never queries core directly
    // --------------------------------------------------
    const { data: isOwner, error: ownerError } = await serviceClient
      .schema("learning")
      .rpc("is_platform_owner", { p_user_id: callerUser.id });

    if (ownerError) {
      return json(
        {
          error: "Failed checking platform owner",
          details: ownerError.message,
          debug: {
            ownerErrorCode: ownerError.code,
            ownerErrorMessage: ownerError.message,
            ownerErrorHint: (ownerError as any).hint ?? null,
            callerUserId: callerUser.id,
          },
        },
        500,
      );
    }

    if (!isOwner) {
      return json({ error: "Forbidden: caller is not a platform owner" }, 403);
    }

    // --------------------------------------------------
    // 3) Resolve principal user by email — create if missing
    // --------------------------------------------------
    const { data: listedUsers, error: listUsersError } =
      await serviceClient.auth.admin.listUsers({ perPage: 1000 });

    if (listUsersError) {
      return json(
        { error: "Failed listing auth users", details: listUsersError.message },
        500,
      );
    }

    let principalAuthUser =
      listedUsers?.users?.find((u) => normalizeEmail(u.email ?? "") === principalEmail) ?? null;

    let principalUserCreated = false;
    let tempPassword: string | null = null;

    if (!principalAuthUser) {
      tempPassword = generateTempPassword();

      const { data: createdUserData, error: createUserError } =
        await serviceClient.auth.admin.createUser({
          email: principalEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: principalName || null,
            created_by: callerUser.id,
            bootstrap_source: "tenant_creation",
          },
        });

      if (createUserError || !createdUserData.user) {
        return json(
          {
            error: "Failed to create principal auth user",
            details: createUserError?.message ?? null,
            code: "PRINCIPAL_AUTH_USER_CREATE_FAILED",
          },
          400,
        );
      }

      principalAuthUser = createdUserData.user;
      principalUserCreated = true;
    }

    // --------------------------------------------------
    // 4) Build realm slug
    // --------------------------------------------------
    const resolvedSlug = schoolSlug ? slugify(schoolSlug) : slugify(schoolName);

    if (!resolvedSlug) {
      return json({ error: "Could not generate a valid slug from schoolName" }, 400);
    }

    // --------------------------------------------------
    // 5) Bootstrap tenant — RPC enforces platform owner check via p_caller_user_id
    // --------------------------------------------------
    const { data: rpcData, error: rpcError } = await serviceClient
      .schema("learning")
      .rpc("create_tenant_bootstrap", {
        p_caller_user_id: callerUser.id,
        p_principal_user_id: principalAuthUser.id,
        p_realm_slug: resolvedSlug,
        p_realm_name: schoolName,
        p_org_slug: resolvedSlug,
        p_org_name: schoolName,
        p_primary_color: primaryColor,
      });

    if (rpcError) {
      return json(
        { error: "Failed to bootstrap tenant", details: rpcError.message, code: rpcError.code },
        500,
      );
    }

    const bootstrapped = (rpcData as CreateTenantBootstrapRow[] | null)?.[0];

    if (!bootstrapped) {
      return json({ error: "RPC returned no data" }, 500);
    }

    return json({
      ok: true,
      realmId: bootstrapped.realm_id,
      organizationId: bootstrapped.organization_id,
      principalActorId: bootstrapped.principal_actor_id,
      membershipId: bootstrapped.membership_id,
      principalEmail: principalAuthUser.email,
      principalUserCreated,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
