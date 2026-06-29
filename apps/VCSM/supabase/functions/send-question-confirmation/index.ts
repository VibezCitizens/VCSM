// @ts-ignore — resolved via deno.json import map at Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore — resolved via deno.json import map at Deno runtime; VS Code TS server does not resolve npm: specifiers
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
// @ts-ignore — resolved via deno.json import map at Deno runtime; VS Code TS server does not resolve npm: specifiers
import React from "react";
import { renderEmail } from "../_shared/emails/render/renderEmail.js";
import { QuestionConfirmationEmail } from "../_shared/emails/templates/QuestionConfirmationEmail.jsx";

// send-question-confirmation — confirms to an anonymous Traffic Q&A asker that
// their question was received and is pending review. Mirrors send-lead-confirmation
// exactly (CORS allow-list, Bearer gate, AWS SES env, React Email render). It is
// best-effort: the caller (Traffic) fires it after the question row is already
// committed and never blocks on it. No delete/remove link is sent — that ships
// only once the server-side token RPC exists.

// ─── CORS ─────────────────────────────────────────────────────────────────────

// Base allowed origin is always the VCSM app. Additional origins (the public
// Traffic site at traffic.vibezcitizens.com) are set via the ALLOWED_ORIGINS env
// var as a comma-separated list — same mechanism as send-lead-confirmation.
const BASE_ORIGIN = "https://vibezcitizens.com";

function getAllowedOrigins(): Set<string> {
  const extra = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const origins = extra.split(",").map((s) => s.trim()).filter(Boolean);
  return new Set([BASE_ORIGIN, ...origins]);
}

function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const origin = (requestOrigin && allowed.has(requestOrigin))
    ? requestOrigin
    : BASE_ORIGIN;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function normalizeDisplayName(name: unknown): string {
  let candidate = "";

  if (typeof name === "string" && name.trim()) {
    candidate = name.trim().split(/\s+/)[0] ?? "";
  }

  if (!candidate) return "there";

  // Avoid all-caps submissions (e.g. "GEORGE" → "George")
  if (candidate === candidate.toUpperCase() && candidate.length > 1) {
    candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
  }

  return candidate;
}

function normalizeTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const title = value.trim();
  if (!title) return null;
  // Echo the asker's own question back; cap length defensively.
  return title.length > 180 ? `${title.slice(0, 177)}…` : title;
}

// ─── SES sender ───────────────────────────────────────────────────────────────

interface SendParams {
  sesClient: SESv2Client;
  fromEmail: string;
  toEmail: string;
  displayName: string;
  questionTitle: string | null;
}

async function sendQuestionConfirmationEmail({
  sesClient,
  fromEmail,
  toEmail,
  displayName,
  questionTitle,
}: SendParams): Promise<void> {
  const { html: htmlBody, text: textBody } = await renderEmail(
    React.createElement(QuestionConfirmationEmail, { displayName, questionTitle }),
  );

  await sesClient.send(
    new SendEmailCommand({
      FromEmailAddress: fromEmail,
      Destination: { ToAddresses: [toEmail] },
      Content: {
        Simple: {
          Subject: {
            Data: "We received your question — Vibez Citizens",
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

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, origin);
  }

  // Require a Bearer token (anon key from the frontend caller). This is not
  // user-auth — Q&A submissions are anonymous — but prevents uncredentialed requests.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, code: "UNAUTHORIZED" }, 401, origin);
  }

  const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const awsRegion = Deno.env.get("AWS_REGION");
  const sesFromEmail = Deno.env.get("SES_FROM_EMAIL");

  if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !sesFromEmail) {
    return json({ ok: false, code: "MISSING_ENV" }, 500, origin);
  }

  let body: {
    email?: unknown;
    name?: unknown;
    title?: unknown;
    source?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return json({ ok: false, code: "INVALID_INPUT" }, 400, origin);
  }

  const toEmail = normalizeEmail(body.email);
  if (!toEmail) {
    return json({ ok: false, code: "INVALID_EMAIL" }, 400, origin);
  }

  const displayName = normalizeDisplayName(body.name);
  const questionTitle = normalizeTitle(body.title);

  const sesClient = new SESv2Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });

  try {
    await sendQuestionConfirmationEmail({
      sesClient,
      fromEmail: sesFromEmail,
      toEmail,
      displayName,
      questionTitle,
    });
  } catch (sesError) {
    const errMsg = sesError instanceof Error ? sesError.message : String(sesError);
    console.error("[send-question-confirmation] SES error:", errMsg);
    return json({ ok: false, code: "EMAIL_SEND_FAILED" }, 200, origin);
  }

  return json({ ok: true }, 200, origin);
});
