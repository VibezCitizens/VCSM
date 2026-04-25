import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore — resolved via deno.json import map at Deno runtime; VS Code TS server does not resolve npm: specifiers
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

function makeInviteCode(): string {
  return crypto.randomUUID();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

async function sendInviteEmail({
  sesClient,
  fromEmail,
  toEmail,
  inviterName,
  inviteLink,
}: {
  sesClient: SESv2Client;
  fromEmail: string;
  toEmail: string;
  inviterName: string;
  inviteLink: string;
}): Promise<void> {
  const safeInviterName = escapeHtml(inviterName);
  const safeInviteLink = escapeHtml(inviteLink);

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to Vibez Citizens</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:520px;background:#1a1a24;border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Vibez Citizens</p>
              <p style="margin:0 0 28px;font-size:16px;color:rgba(255,255,255,0.70);line-height:1.6;">
                <strong style="color:#ffffff;">${safeInviterName}</strong> invited you to join Vibez Citizens.
              </p>
              <a href="${safeInviteLink}"
                 style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.1px;">
                Join Vibez Citizens
              </a>
              <p style="margin:32px 0 0;font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;">
                If you didn't expect this invitation, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody =
    `${inviterName} invited you to join Vibez Citizens.\n\nJoin here: ${inviteLink}`;

  await sesClient.send(
    new SendEmailCommand({
      FromEmailAddress: fromEmail,
      Destination: { ToAddresses: [toEmail] },
      Content: {
        Simple: {
          Subject: {
            Data: `${inviterName} invited you to Vibez Citizens`,
            Charset: "UTF-8",
          },
          Body: {
            Html: { Data: htmlBody, Charset: "UTF-8" },
            Text: { Data: textBody, Charset: "UTF-8" },
          },
        },
      },
    }),
  );
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, code: "UNAUTHORIZED" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const awsRegion = Deno.env.get("AWS_REGION");
  const sesFromEmail = Deno.env.get("SES_FROM_EMAIL");

  if (
    !supabaseUrl || !anonKey || !serviceKey ||
    !awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !sesFromEmail
  ) {
    return json({ ok: false, code: "MISSING_ENV" }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json({ ok: false, code: "UNAUTHORIZED" }, 401);
  }

  let body: {
    targetEmail?: string;
    inviterType?: "citizen" | "vport";
    inviterActorId?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return json({ ok: false, code: "INVALID_INPUT" }, 400);
  }

  const normalizedEmail = normalizeEmail(body.targetEmail);
  const inviterType = body.inviterType;

  if (!normalizedEmail || !inviterType || !["citizen", "vport"].includes(inviterType)) {
    return json({ ok: false, code: "INVALID_INPUT" }, 400);
  }

  if (user.email?.toLowerCase() === normalizedEmail) {
    return json({ ok: false, code: "SELF_INVITE" }, 200);
  }

  const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();

  if (listError) {
    return json({ ok: false, code: "USER_LOOKUP_FAILED" }, 500);
  }

  const alreadyExists = existingUsers?.users?.some(
    (u: { email?: string | null }) => u.email?.toLowerCase() === normalizedEmail,
  );

  if (alreadyExists) {
    return json({ ok: false, code: "USER_ALREADY_REGISTERED" }, 200);
  }

  let resolvedActorId: string | null = null;
  let inviterName = "Someone";

  if (inviterType === "citizen") {
    const { data: ownerRows, error: ownerError } = await adminClient
      .schema("vc")
      .from("actor_owners")
      .select("actor_id, is_primary")
      .eq("user_id", user.id)
      .eq("is_void", false);

    if (ownerError) {
      return json({ ok: false, code: "ACTOR_LOOKUP_FAILED" }, 500);
    }

    const actorIds = (ownerRows ?? []).map((row: { actor_id: string }) => row.actor_id);

    if (!actorIds.length) {
      return json({ ok: false, code: "NO_CITIZEN_ACTOR" }, 400);
    }

    const { data: citizenActors, error: actorError } = await adminClient
      .schema("vc")
      .from("actors")
      .select("id, profile_id, created_at")
      .in("id", actorIds)
      .eq("kind", "user")
      .eq("is_void", false)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(1);

    if (actorError) {
      return json({ ok: false, code: "ACTOR_LOOKUP_FAILED" }, 500);
    }

    const citizenActor = citizenActors?.[0];

    if (!citizenActor?.id) {
      return json({ ok: false, code: "NO_CITIZEN_ACTOR" }, 400);
    }

    resolvedActorId = citizenActor.id;

    if (citizenActor.profile_id) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("display_name")
        .eq("id", citizenActor.profile_id)
        .maybeSingle();

      if (profile?.display_name) {
        inviterName = profile.display_name;
      }
    }
  }

  if (inviterType === "vport") {
    const inviterActorId = body.inviterActorId;

    if (!inviterActorId) {
      return json({ ok: false, code: "MISSING_VPORT_ACTOR" }, 400);
    }

    const { data: ownerRow, error: ownerError } = await adminClient
      .schema("vc")
      .from("actor_owners")
      .select("actor_id")
      .eq("user_id", user.id)
      .eq("actor_id", inviterActorId)
      .eq("is_void", false)
      .maybeSingle();

    if (ownerError) {
      return json({ ok: false, code: "ACTOR_LOOKUP_FAILED" }, 500);
    }

    if (!ownerRow?.actor_id) {
      return json({ ok: false, code: "VPORT_NOT_OWNED" }, 403);
    }

    const { data: actorRow, error: actorError } = await adminClient
      .schema("vc")
      .from("actors")
      .select("id, vport_id")
      .eq("id", inviterActorId)
      .eq("kind", "vport")
      .eq("is_void", false)
      .eq("is_deleted", false)
      .maybeSingle();

    if (actorError) {
      return json({ ok: false, code: "ACTOR_LOOKUP_FAILED" }, 500);
    }

    if (!actorRow?.id || !actorRow?.vport_id) {
      return json({ ok: false, code: "VPORT_ACTOR_NOT_FOUND" }, 404);
    }

    resolvedActorId = actorRow.id;

    const { data: vportRow } = await adminClient
      .schema("vport")
      .from("profiles")
      .select("business_name, name")
      .eq("id", actorRow.vport_id)
      .maybeSingle();

    inviterName =
      vportRow?.business_name ||
      vportRow?.name ||
      "A VPORT on Vibez Citizens";
  }

  if (!resolvedActorId) {
    return json({ ok: false, code: "ACTOR_LOOKUP_FAILED" }, 500);
  }

  const inviteCode = makeInviteCode();
  const inviteLink = `https://vibezcitizens.com/register?invite_code=${inviteCode}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const metadata = {
    source: "explore_onboarding",
    inviter_name: inviterName,
    inviter_type: inviterType,
    inviter_user_id: user.id,
    inviter_actor_id: resolvedActorId,
  };

  const { data: inviteRow, error: insertError } = await adminClient
    .schema("vc")
    .from("vibe_invites")
    .insert({
      inviter_actor_id: resolvedActorId,
      invite_channel: "email",
      invite_target: normalizedEmail,
      invite_code: inviteCode,
      status: "pending",
      metadata,
      expires_at: expiresAt,
    })
    .select("id, invite_code")
    .single();

  if (insertError) {
    return json({
      ok: false,
      code: "INVITE_RECORD_FAILED",
      message: insertError.message,
    }, 500);
  }

  const sesClient = new SESv2Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });

  try {
    await sendInviteEmail({
      sesClient,
      fromEmail: sesFromEmail,
      toEmail: normalizedEmail,
      inviterName,
      inviteLink,
    });
  } catch (sesError) {
    const errMsg = sesError instanceof Error ? sesError.message : String(sesError);

    await adminClient
      .schema("vc")
      .from("vibe_invites")
      .update({
        status: "cancelled",
        metadata: {
          ...metadata,
          cancelled_reason: "EMAIL_SEND_FAILED",
          email_error: errMsg,
        },
      })
      .eq("id", inviteRow.id);

    return json({ ok: false, code: "EMAIL_SEND_FAILED" }, 200);
  }

  await adminClient
    .schema("vc")
    .from("actor_onboarding_steps")
    .upsert(
      {
        actor_id: resolvedActorId,
        step_key: "invite_first_citizen",
        status: "completed",
        progress: 1,
        completed_at: new Date().toISOString(),
        last_evaluated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        meta: {
          invite_id: inviteRow.id,
          invite_code: inviteCode,
          invite_channel: "email",
          invite_target: normalizedEmail,
          source: "explore_onboarding",
        },
      },
      { onConflict: "actor_id,step_key" },
    );

  return json({
    ok: true,
    invite_id: inviteRow.id,
    invite_code: inviteCode,
  }, 200);
});
