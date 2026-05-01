import { SECURITY_HEADERS } from "../_shared/securityHeaders.js";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imageMime(url) {
  const ext = String(url || "")
    .split("?")[0]
    .split(".")
    .pop()
    .toLowerCase();

  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

async function readPublicProfileBySlug({ slug, env, origin }) {
  if (!slug || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  const encodedSlug = encodeURIComponent(slug);
  const url =
    `${env.SUPABASE_URL}/rest/v1/profiles` +
    `?slug=eq.${encodedSlug}` +
    `&is_active=eq.true` +
    `&is_deleted=eq.false` +
    `&directory_visible=eq.true` +
    `&directory_status=eq.listed` +
    `&select=name,bio,avatar_url,profile_public_details!inner(logo_url,location_text)` +
    `&limit=1`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        "Accept-Profile": "vport",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return null;
    const rows = await response.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.name) return null;

    const details = row.profile_public_details || null;
    const logo = details?.logo_url || row.avatar_url || "";
    const image = logo
      ? logo.startsWith("http")
        ? logo
        : `${origin}${logo}`
      : `${origin}/VportBusinnesCard.jpeg`;

    return {
      name: row.name,
      bio: row.bio || "",
      location: details?.location_text || "",
      image,
    };
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const { request, params, env } = context;
  const slug = String(params.slug || "").trim().toLowerCase();
  const origin = new URL(request.url).origin;
  const canonical = `${origin}/p/${slug}`;
  const fallbackImage = `${origin}/VportBusinnesCard.jpeg`;

  let title = "WanderEx Profile | Vibez Citizens";
  let description = "View provider details, services, and booking request flow on WanderEx.";
  let image = fallbackImage;

  const profile = await readPublicProfileBySlug({ slug, env, origin });
  if (profile) {
    title = `${profile.name} | WanderEx`;
    description = profile.bio
      ? `${profile.name} on WanderEx. ${profile.bio}`
      : `${profile.name} public profile on WanderEx.`;
    if (profile.location) description = `${description} ${profile.location}`;
    image = profile.image || fallbackImage;
  }

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
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Vibez Citizens" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="${imageMime(image)}" />
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
