// functions/vport/[slug]/card.js
// Cloudflare Pages Function — intercepts /vport/:slug/card at the edge,
// rewrites index.html with per-VPORT Open Graph + Twitter Card meta tags
// before the SPA loads. This is the only way to support iMessage, WhatsApp,
// Facebook, and other crawlers that do not execute JavaScript.
//
// Required Cloudflare Pages env vars (set in Pages → Settings → Environment variables):
//   SUPABASE_URL       — e.g. https://xyzxyz.supabase.co
//   SUPABASE_ANON_KEY  — public anon key (safe to expose; RPC is anon-accessible)
//
// Falls back to static preview if the Supabase call fails or the card is unavailable.

export async function onRequest(context) {
  const { request, params, env } = context;

  const slug = (params.slug || "").trim();
  const url = new URL(request.url);
  const ORIGIN = url.origin;

  const CANONICAL = `${ORIGIN}/vport/${slug}/card`;
  const FALLBACK_IMAGE = `${ORIGIN}/VportBusinnesCard.jpeg`;

  // --- Default (static) values ------------------------------------------------
  let title = "VPORT Business Card | Vibez Citizens";
  let description = "Connect with this business on Vibez Citizens.";
  let image = FALLBACK_IMAGE;

  // --- Try to load real card data from Supabase --------------------------------
  if (slug && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      const rpcRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/rpc/read_business_card_public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": env.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
            // The function lives in the vport schema
            "Accept-Profile": "vport",
          },
          body: JSON.stringify({ p_slug: slug }),
          signal: AbortSignal.timeout(3000),
        }
      );

      if (rpcRes.ok) {
        const rows = await rpcRes.json();
        const card = Array.isArray(rows) ? rows[0] : rows;

        if (card?.business_name) {
          title = `${card.business_name} Business Card | Vibez Citizens`;

          const descParts = [card.bio, card.location_text, card.phone_public]
            .map((v) => (v || "").trim())
            .filter(Boolean);

          description =
            descParts.length > 0
              ? `${card.business_name} on Vibez Citizens. ${descParts[0]}`
              : `${card.business_name} business card on Vibez Citizens.`;

          // Use logo > avatar > fallback. Ensure URL is absolute.
          const rawImg = card.logo_url || card.avatar_url || "";
          if (rawImg) {
            image = rawImg.startsWith("http") ? rawImg : `${ORIGIN}${rawImg}`;
          }
        }
      }
    } catch {
      // Network timeout or fetch error — static fallback stays in place
    }
  }

  // --- Fetch and rewrite index.html -------------------------------------------
  const indexRes = await env.ASSETS.fetch(new Request("https://dummy/index.html"));
  if (!indexRes || indexRes.status !== 200) {
    return new Response("index.html not found", { status: 500 });
  }

  let html = await indexRes.text();

  // Strip all OG, Twitter, and canonical tags that ship in index.html to
  // avoid duplicates. Same regex approach as wanders/c/[publicId].js.
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
      "content-type": "text/html; charset=UTF-8",
      // 60s public cache — short enough that unpublish/delete propagates quickly
      "cache-control": "public, max-age=60",
    },
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
