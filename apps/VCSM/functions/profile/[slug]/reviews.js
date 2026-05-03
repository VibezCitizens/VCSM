import { SECURITY_HEADERS } from "../../_shared/securityHeaders.js";

// Cloudflare Pages Function — intercepts /profile/:slug/reviews at the edge,
// rewrites index.html with VPORT-specific Open Graph + Twitter Card meta tags
// before the SPA loads. Same query pattern as menu.js.
//
// Required Cloudflare Pages env vars:
//   SUPABASE_URL       — e.g. https://xyzxyz.supabase.co
//   SUPABASE_ANON_KEY  — public anon key

export async function onRequest(context) {
  const { request, params, env } = context;

  const slug = (params.slug || "").trim();
  const url = new URL(request.url);
  const ORIGIN = url.origin;

  const CANONICAL = `${ORIGIN}/profile/${slug}/reviews`;
  const FALLBACK_IMAGE = `${ORIGIN}/VCSMcard.jpeg`;

  let title = "VPORT Reviews | Vibez Citizens";
  let description = "Read reviews for this business on Vibez Citizens.";
  let image = FALLBACK_IMAGE;

  if (slug && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&is_deleted=eq.false&select=name,bio,avatar_url,logo_url&limit=1`,
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
          title = `${vport.name} Reviews | Vibez Citizens`;
          description = vport.bio
            ? `Reviews for ${vport.name} on Vibez Citizens. ${vport.bio}`
            : `Read customer reviews for ${vport.name} on Vibez Citizens.`;

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
