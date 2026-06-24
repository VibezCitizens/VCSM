// @ts-ignore — resolved via deno.json import map at Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore — resolved via deno.json import map at Deno runtime; VS Code TS server does not resolve npm: specifiers
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
// @ts-ignore — resolved via deno.json import map at Deno runtime; VS Code TS server does not resolve npm: specifiers
import React from "react";
import { renderEmail } from "../_shared/emails/render/renderEmail.js";
import { LeadConfirmationEmail } from "../_shared/emails/templates/LeadConfirmationEmail.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIBEZ_LOGO_URL = "https://vibezcitizens.com/vibez-icon-512x512.png";
const VIBEZ_HOME_URL = "https://vibezcitizens.com";

// ─── CORS ─────────────────────────────────────────────────────────────────────

// Base allowed origin is always the VCSM app. Additional origins (external
// business sites that embed lead forms) are set via the ALLOWED_ORIGINS env var
// as a comma-separated list, e.g. "https://tripointlockandkeys.com,https://example.com".
const BASE_ORIGIN = "https://vibezcitizens.com";

function getAllowedOrigins(): Set<string> {
  const extra = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const origins = extra.split(",").map(s => s.trim()).filter(Boolean);
  return new Set([BASE_ORIGIN, ...origins]);
}

function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const origin = (requestOrigin && allowed.has(requestOrigin))
    ? requestOrigin
    : BASE_ORIGIN;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, content-type",
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || !email.includes("@") || email.length < 5) return null;
  return email;
}

function normalizeDisplayName(firstName: unknown, name: unknown): string {
  let candidate = "";

  if (typeof firstName === "string" && firstName.trim()) {
    candidate = firstName.trim();
  } else if (typeof name === "string" && name.trim()) {
    candidate = name.trim().split(/\s+/)[0] ?? "";
  }

  if (!candidate) return "there";

  // Avoid all-caps submissions (e.g. "GEORGE" → "George")
  if (candidate === candidate.toUpperCase() && candidate.length > 1) {
    candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
  }

  return candidate;
}

function normalizeProvider(vportName: unknown, businessName: unknown): string {
  if (typeof vportName === "string" && vportName.trim()) return vportName.trim();
  if (typeof businessName === "string" && businessName.trim()) return businessName.trim();
  return "this provider";
}

function isSafeUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

// ─── Email template ───────────────────────────────────────────────────────────

interface TemplateParams {
  displayName: string;
  provider: string;
  providerProfileUrl: string | null;
}

function buildLeadConfirmationHtml({
  displayName,
  provider,
}: TemplateParams): string {
  const safeDisplayName = escapeHtml(displayName);
  const safeProvider = escapeHtml(provider);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Request received by Vibez Citizens</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0b0f;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Outer wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#0b0b0f" style="background-color:#0b0b0f;">
    <tr>
      <td align="center" valign="top" style="padding:40px 16px 56px;">

        <!-- Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#13111f;border-radius:20px;">

          <!-- Header strip -->
          <tr>
            <td bgcolor="#5b21b6" style="background:linear-gradient(135deg,#3b0764 0%,#5b21b6 50%,#7c5cff 100%);padding:20px 28px;border-radius:20px 20px 0 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="58" valign="middle">
                    <img
                      src="${VIBEZ_LOGO_URL}"
                      alt="Vibez Citizens"
                      width="48"
                      height="48"
                      style="display:block;border:0;outline:none;text-decoration:none;border-radius:10px;width:48px;height:48px;"
                    />
                  </td>
                  <td valign="middle" style="padding-left:10px;">
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Vibez Citizens</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">

              <!-- Heading -->
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;line-height:1.2;">
                Request received
              </p>

              <!-- Spacer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td height="22" style="font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- Greeting -->
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#e2e8f0;line-height:1.6;">
                Hey ${safeDisplayName},
              </p>

              <!-- Body copy -->
              <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#b8c0cc;line-height:1.75;">
                Thanks for sending a request to <strong style="color:#ffffff;">${safeProvider}</strong>.
                Your message was received successfully.
              </p>

              <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#b8c0cc;line-height:1.75;">
                <strong style="color:#ffffff;">${safeProvider}</strong> should contact you soon
                using the information you provided.
              </p>

              <!-- Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td height="1" bgcolor="#2a2540" style="background-color:#2a2540;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Spacer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td height="24" style="font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- Growth section 1 copy -->
              <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8892a0;line-height:1.65;">
                If you want, you can create a Vibez Citizens profile and start building your presence across trusted local businesses.
              </p>

              <!-- Growth section 1 button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;" bgcolor="#7c5cff">
                    <a href="https://vibezcitizens.com/how-to/create-profile"
                       style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;background-color:#7c5cff;"
                    >Start your Vibez profile</a>
                  </td>
                </tr>
              </table>

              <!-- Spacer between sections -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td height="28" style="font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- Divider between sections -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td height="1" bgcolor="#2a2540" style="background-color:#2a2540;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Spacer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td height="24" style="font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- Growth section 2 copy -->
              <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8892a0;line-height:1.65;">
                Also&#x2014;if you run a business, Vibez Citizens lets you turn real customer reviews into visibility and trust.
              </p>

              <!-- Growth section 2 button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;" bgcolor="#7c5cff">
                    <a href="https://vibezcitizens.com/how-to/create-vport"
                       style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;background-color:#7c5cff;"
                    >Add your business</a>
                  </td>
                </tr>
              </table>

              <!-- Bottom spacer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td height="8" style="font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:14px 32px 28px;border-top:1px solid #1e1a30;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#4a4a5a;line-height:1.5;text-align:center;">
                &#x2014; Vibez Citizens
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function buildLeadConfirmationText({
  displayName,
  provider,
}: TemplateParams): string {
  return [
    `Request received`,
    ``,
    `Hey ${displayName},`,
    ``,
    `Thanks for sending a request to ${provider}. Your message was received successfully.`,
    ``,
    `${provider} should contact you soon using the information you provided.`,
    ``,
    `---`,
    ``,
    `If you want, you can create a Vibez Citizens profile and start building your presence across trusted local businesses.`,
    `Start your Vibez profile:`,
    `https://vibezcitizens.com/how-to/create-profile`,
    ``,
    `---`,
    ``,
    `Also, if you run a business, Vibez Citizens lets you turn real customer reviews into visibility and trust.`,
    `Add your business:`,
    `https://vibezcitizens.com/how-to/create-vport`,
    ``,
    `Thank you,`,
    `The Vibez Citizens Team`,
  ].join("\n");
}

// ─── SES sender ───────────────────────────────────────────────────────────────

interface SendParams {
  sesClient: SESv2Client;
  fromEmail: string;
  toEmail: string;
  displayName: string;
  provider: string;
  providerProfileUrl: string | null;
}

async function sendLeadConfirmationEmail({
  sesClient,
  fromEmail,
  toEmail,
  displayName,
  provider,
  providerProfileUrl,
}: SendParams): Promise<void> {
  const { html: htmlBody, text: textBody } = await renderEmail(
    React.createElement(LeadConfirmationEmail, { displayName, provider, providerProfileUrl }),
  );

  await sesClient.send(
    new SendEmailCommand({
      FromEmailAddress: fromEmail,
      Destination: { ToAddresses: [toEmail] },
      Content: {
        Simple: {
          Subject: {
            Data: "Request received by Vibez Citizens",
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

  // Require a Bearer token (anon key or service key from frontend/server callers).
  // This is not user-auth — lead forms are anonymous — but prevents uncredentialed requests.
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
    firstName?: unknown;
    name?: unknown;
    phone?: unknown;
    message?: unknown;
    vportName?: unknown;
    businessName?: unknown;
    providerProfileUrl?: unknown;
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

  const displayName = normalizeDisplayName(body.firstName, body.name);
  const provider = normalizeProvider(body.vportName, body.businessName);
  const providerProfileUrl = isSafeUrl(body.providerProfileUrl)
    ? (body.providerProfileUrl as string).trim()
    : null;

  const sesClient = new SESv2Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });

  try {
    await sendLeadConfirmationEmail({
      sesClient,
      fromEmail: sesFromEmail,
      toEmail,
      displayName,
      provider,
      providerProfileUrl,
    });
  } catch (sesError) {
    const errMsg = sesError instanceof Error ? sesError.message : String(sesError);
    console.error("[send-lead-confirmation] SES error:", errMsg);
    return json({ ok: false, code: "EMAIL_SEND_FAILED" }, 200, origin);
  }

  return json({ ok: true }, 200, origin);
});
