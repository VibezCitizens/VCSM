// functions/wanders/c/[publicId].js
export async function onRequest(context) {
  const { request, params, env } = context;

  const publicId = (params.publicId || "").trim();
  const url = new URL(request.url);

  // Use the real origin (covers preview envs + prod)
  const ORIGIN = url.origin;

  // Final deep-link URL that your SPA handles
  const CANONICAL = `${ORIGIN}/wanders/c/${publicId}`;

  // ✅ Your fallback image (from /public/og)
  const IMAGE = `${ORIGIN}/og/wanders-envelope.jpeg`;

  // Basic copy (you can personalize later if you fetch card content)
  const TITLE = "Wanders — A card for you 💌";
  const DESC = "Someone sent you a Wanders card. Tap to open.";

  // ✅ Fetch the built SPA index from Pages static assets
  const indexRes = await env.ASSETS.fetch(new Request("https://dummy/index.html"));
  if (!indexRes || indexRes.status !== 200) {
    return new Response("index.html not found", { status: 500 });
  }

  let html = await indexRes.text();

  // ---------------------------------------------------------------------------
  // Helpers: remove existing OG/Twitter tags to avoid duplicates, then inject ours
  // ---------------------------------------------------------------------------
  const stripMeta = (s) =>
    s
      // OG
      .replace(/<meta\s+property=["']og:[^"']+["']\s+content=["'][^"']*["']\s*\/?>\s*/gi, "")
      // Twitter
      .replace(/<meta\s+name=["']twitter:[^"']+["']\s+content=["'][^"']*["']\s*\/?>\s*/gi, "")
      // Canonical
      .replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>\s*/gi, "");

  html = stripMeta(html);

  const injected = `
    <link rel="canonical" href="${CANONICAL}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Vibez Citizens" />
    <meta property="og:title" content="${escapeHtml(TITLE)}" />
    <meta property="og:description" content="${escapeHtml(DESC)}" />
    <meta property="og:url" content="${CANONICAL}" />
    <meta property="og:image" content="${IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(TITLE)}" />
    <meta name="twitter:description" content="${escapeHtml(DESC)}" />
    <meta name="twitter:image" content="${IMAGE}" />
  `.trim();

  // Inject right before </head>
  html = html.replace(/<\/head>/i, `${injected}\n</head>`);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      // social bots like fresh HTML
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
