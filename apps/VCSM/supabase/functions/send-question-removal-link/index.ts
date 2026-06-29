// @ts-ignore — resolved via deno.json import map at Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore — service-role Supabase client (same source as publish-lead-notification)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore — resolved via deno.json import map at Deno runtime
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
// @ts-ignore — resolved via deno.json import map at Deno runtime
import React from "react";
import { renderEmail } from "../_shared/emails/render/renderEmail.js";
import { QuestionRemovalLinkEmail } from "../_shared/emails/templates/QuestionRemovalLinkEmail.jsx";

// send-question-removal-link — orchestrates anonymous creator self-removal of a
// Traffic Q&A QUESTION (TICKET-TRAZE-QA-OWNER-REMOVAL-DB-001).
//
// Flow (Edge-Function-orchestrated; NO pg_net):
//   1. Browser POSTs { slug, email }.
//   2. This function (service role) calls answers.request_question_removal_link,
//      which checks the email server-side and, ON MATCH ONLY, mints a 30-minute
//      single-use token and returns the RAW token to this trusted caller.
//   3. If a token came back, we SES-send a removal link to that email.
//   4. We ALWAYS return a generic { ok: true } — the browser never learns
//      whether the email matched, and the raw token is never returned or logged.
//
// Combines the two existing precedents:
//   - publish-lead-notification: service-role client calling a SECURITY DEFINER
//     RPC server-side, never leaking existence.
//   - send-lead-confirmation: SES + React Email render pipeline.

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Base origin is the VCSM app; the public Traffic site is added via ALLOWED_ORIGINS
// (comma-separated), exactly like send-lead-confirmation. Must include
// https://traffic.vibezcitizens.com.
const BASE_ORIGIN = "https://vibezcitizens.com";

function getAllowedOrigins(): Set<string> {
  const extra = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const origins = extra.split(",").map((s) => s.trim()).filter(Boolean);
  return new Set([BASE_ORIGIN, ...origins]);
}

function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const origin = (requestOrigin && allowed.has(requestOrigin)) ? requestOrigin : BASE_ORIGIN;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || !email.includes("@") || email.length < 5) return null;
  return email;
}

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.trim();
  if (!slug || slug.length > 200) return null;
  return slug;
}

async function sendRemovalEmail(opts: {
  sesClient: SESv2Client;
  fromEmail: string;
  toEmail: string;
  removeUrl: string;
}): Promise<void> {
  const { html: htmlBody, text: textBody } = await renderEmail(
    React.createElement(QuestionRemovalLinkEmail, { removeUrl: opts.removeUrl }),
  );

  await opts.sesClient.send(
    new SendEmailCommand({
      FromEmailAddress: opts.fromEmail,
      Destination: { ToAddresses: [opts.toEmail] },
      Content: {
        Simple: {
          Subject: { Data: "Remove your question — Vibez Citizens", Charset: "UTF-8" },
          Body: {
            Html: { Data: htmlBody, Charset: "UTF-8" },
            Text: { Data: textBody, Charset: "UTF-8" },
          },
        },
      },
    }),
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, origin);
  }

  // Anonymous flow, but require a Bearer (anon key) to block uncredentialed calls.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, code: "UNAUTHORIZED" }, 401, origin);
  }

  let body: { slug?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, code: "INVALID_INPUT" }, 400, origin);
  }

  const slug = normalizeSlug(body.slug);
  const email = normalizeEmail(body.email);

  // Missing/garbage input → generic OK (never reveal anything). Nothing is sent.
  if (!slug || !email) {
    return json({ ok: true }, 200, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    // Do not leak config state to the browser; generic OK.
    console.error("[send-question-removal-link] missing Supabase env");
    return json({ ok: true }, 200, origin);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Service-role: email match + token mint happen entirely server-side.
  let rawToken: string | null = null;
  try {
    const { data, error } = await admin
      .schema("answers")
      .rpc("request_question_removal_link", { p_question_slug: slug, p_email: email });
    if (error) {
      console.error("[send-question-removal-link] request RPC failed:", error.message);
      return json({ ok: true }, 200, origin); // still generic
    }
    rawToken = typeof data === "string" && data.length > 0 ? data : null;
  } catch (e) {
    console.error("[send-question-removal-link] request RPC threw:", e instanceof Error ? e.message : String(e));
    return json({ ok: true }, 200, origin);
  }

  // No match (or nothing to do): generic OK, no email sent, no signal.
  if (!rawToken) {
    return json({ ok: true }, 200, origin);
  }

  const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const awsRegion = Deno.env.get("AWS_REGION");
  const sesFromEmail = Deno.env.get("SES_FROM_EMAIL");
  const removeBaseUrl = (Deno.env.get("REMOVE_LINK_BASE_URL") ?? "https://traffic.vibezcitizens.com").replace(/\/+$/, "");

  if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !sesFromEmail) {
    console.error("[send-question-removal-link] missing SES env");
    return json({ ok: true }, 200, origin); // generic
  }

  const removeUrl = `${removeBaseUrl}/answers/remove?t=${encodeURIComponent(rawToken)}`;

  const sesClient = new SESv2Client({
    region: awsRegion,
    credentials: { accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretAccessKey },
  });

  try {
    await sendRemovalEmail({ sesClient, fromEmail: sesFromEmail, toEmail: email, removeUrl });
  } catch (sesError) {
    // Never log the token or the URL containing it.
    console.error("[send-question-removal-link] SES error:", sesError instanceof Error ? sesError.message : String(sesError));
    return json({ ok: true }, 200, origin); // generic
  }

  return json({ ok: true }, 200, origin);
});
