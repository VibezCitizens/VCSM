import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore — resolved via deno.json import map at Deno runtime; VS Code TS server does not resolve npm: specifiers
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
// @ts-ignore — resolved via deno.json import map at Deno runtime; VS Code TS server does not resolve npm: specifiers
import React from "react";
import { renderEmail } from "../_shared/emails/render/renderEmail.js";
import { CitizenInviteEmail } from "../_shared/emails/templates/CitizenInviteEmail.jsx";

const ALLOWED_ORIGIN = "https://vibezcitizens.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, content-type",
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
  const { html: htmlBody, text: textBody } = await renderEmail(
    React.createElement(CitizenInviteEmail, { inviterName, inviteLink }),
  );

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
    // Account-enumeration hardening (V13-L1): an already-registered email must be
    // INDISTINGUISHABLE from a fresh invite. Do not create an invite row or send an
    // email to an existing account; return the SAME uniform success the real-invite
    // path returns. The prior `USER_ALREADY_REGISTERED` differential is removed.
    return json({ ok: true }, 200);
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

  // Per-inviter abuse throttle (V13-L1): cap concurrent ACTIVE pending email invites
  // from a single inviter to bound email-bombing. Uses only columns this function
  // already writes (inviter_actor_id, invite_channel, status, expires_at) — no schema
  // assumption — and FAILS OPEN on query error so a transient/DB issue never blocks a
  // legitimate inviter. The rejection references only the inviter, never the target,
  // so it leaks nothing about account existence.
  const MAX_ACTIVE_PENDING_EMAIL_INVITES = 20;
  const throttleNowIso = new Date().toISOString();
  const { count: activePendingInvites, error: throttleError } = await adminClient
    .schema("vc")
    .from("vibe_invites")
    .select("id", { count: "exact", head: true })
    .eq("inviter_actor_id", resolvedActorId)
    .eq("invite_channel", "email")
    .eq("status", "pending")
    .gt("expires_at", throttleNowIso);

  if (!throttleError && (activePendingInvites ?? 0) >= MAX_ACTIVE_PENDING_EMAIL_INVITES) {
    return json({ ok: false, code: "RATE_LIMITED" }, 200);
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
    return json({ ok: false, code: "INVITE_RECORD_FAILED" }, 500);
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

  // Uniform success body — must match the already-registered short-circuit above so
  // the response cannot be used to enumerate accounts (V13-L1). invite_id/invite_code
  // are not consumed by any client (useInvite branches only on `ok`).
  return json({ ok: true }, 200);
});
