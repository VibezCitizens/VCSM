import { SECURITY_HEADERS } from "../_shared/securityHeaders.js";

// Cloudflare Pages Function — intercepts /how-to/:slug at the edge.
// Rewrites index.html with per-guide canonical + OG tags before the SPA loads.
// These pages are public SEO landing pages (sitemap priority 0.8).

function formatSlugTitle(slug) {
  return String(slug || "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function onRequest(context) {
  const { request, params, env } = context;
  const slug = String(params.slug || "").trim().toLowerCase();
  const origin = new URL(request.url).origin;
  const canonical = `${origin}/how-to/${slug}`;

  const pageTitle = formatSlugTitle(slug);
  const title = `How To ${pageTitle} | Vibez Citizens`;
  const description = `Step-by-step guide: how to ${slug.replace(/-/g, " ")} on Vibez Citizens. For creators, service providers, and community members.`;
  const image = `${origin}/VCSMcard.jpeg`;

  const indexRes = await env.ASSETS.fetch(new Request("https://dummy/index.html"));
  if (!indexRes || indexRes.status !== 200) {
    return new Response("index.html not found", { status: 500 });
  }

  let html = await indexRes.text();

  html = html
    .replace(/<meta\s+property=["']og:[^"']+["']\s+content=["'][^"']*["']\s*\/?>\s*/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["']\s+content=["'][^"']*["']\s*\/?>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>\s*/gi, "");

  const injected = `
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Vibez Citizens" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
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
      ...SECURITY_HEADERS,
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
