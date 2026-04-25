// functions/m/[actorId].js
import { SECURITY_HEADERS } from "../_shared/securityHeaders.js";
// Cloudflare Pages Function — intercepts /m/:actorId (QR short link) at the edge.
// Same OG injection as /profile/:slug/menu but looks up by actor_id.
//
// Required Cloudflare Pages env vars:
//   SUPABASE_URL       — e.g. https://xyzxyz.supabase.co
//   SUPABASE_ANON_KEY  — public anon key

export async function onRequest(context) {
  const { request, params, env } = context;

  const actorId = (params.actorId || "").trim();
  const url = new URL(request.url);
  const ORIGIN = url.origin;

  const CANONICAL = `${ORIGIN}/m/${actorId}`;
  const FALLBACK_IMAGE = `${ORIGIN}/RestaurantMenu.jpeg`;

  // --- Default (static) values ------------------------------------------------
  let title = "VPORT Menu | Vibez Citizens";
  let description = "View this business menu on Vibez Citizens.";
  let image = FALLBACK_IMAGE;

  // --- Try to load real VPORT data from Supabase ------------------------------
  if (actorId && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?actor_id=eq.${encodeURIComponent(actorId)}&is_active=eq.true&is_deleted=eq.false&select=name,bio,avatar_url,logo_url,slug&limit=1`,
        {
          method: "GET",
          headers: {
            "apikey": env.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
            "Accept-Profile": "vport",
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(3000),
        }
      );

      if (res.ok) {
        const rows = await res.json();
        const vport = Array.isArray(rows) ? rows[0] : null;

        if (vport?.name) {
          title = `${vport.name} Menu | Vibez Citizens`;
          description = vport.bio
            ? `${vport.name} on Vibez Citizens. ${vport.bio}`
            : `View ${vport.name}'s menu on Vibez Citizens.`;

          const rawImg = vport.logo_url || vport.avatar_url || "";
          if (rawImg) {
            image = rawImg.startsWith("http") ? rawImg : `${ORIGIN}${rawImg}`;
          }
        }
      }
    } catch {
      // Timeout or network error — static fallback stays in place
    }
  }

  // --- Fetch and rewrite index.html -------------------------------------------
  const indexRes = await env.ASSETS.fetch(new Request("https://dummy/index.html"));
  if (!indexRes || indexRes.status !== 200) {
    return new Response("index.html not found", { status: 500 });
  }

  let html = await indexRes.text();

  const stripMeta = (s) =>
    s
      .replace(/<meta\s+property=["']og:[^"']+["']\s+content=["'][^"']*["']\s*\/?>\s*/gi, "")
      .replace(/<meta\s+name=["']twitter:[^"']+["']\s+content=["'][^"']*["']\s*\/?>\s*/gi, "")
      .replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>\s*/gi, "");

  html = stripMeta(html);

  const injected = `
    <link rel="canonical" href="${CANONICAL}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Vibez Citizens" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${CANONICAL}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="${getImageMimeType(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  `.trim();

  html = html.replace(/<\/head>/i, `${injected}\n</head>`);

  return new Response(html, {
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "public, max-age=60",
    },
  });
}

function getImageMimeType(url) {
  const ext = (url || "").split("?")[0].split(".").pop().toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
