export async function onRequest(context) {
  const { request, params, env } = context;
  const id = params.id;

  // Your real domain
  const PUBLIC_ORIGIN = "https://vibezcitizens.com";

  // TODO: replace with real data fetch if you want title/desc personalized
  // For now: generic preview like your local test
  const toName = "someone";
  const title = `💌 A LoveDrop for ${toName}`;
  const description = "Someone sent you something sweet. Tap to open.";
  const url = `${PUBLIC_ORIGIN}/lovedrop/v/${id}`;

  const image = "https://cdn.vibezcitizens.com/og/vibez-citizens-1200x630.png";

  // ✅ Fetch the built index.html from Pages static assets
  const indexRes = await env.ASSETS.fetch(new Request("https://dummy/index.html"));


  if (!indexRes || indexRes.status !== 200) {
    return new Response("index.html not found", { status: 500 });
  }

  let html = await indexRes.text();

  // Clean existing OG/Twitter (avoid duplicates)
  html = html
    .replace(/<meta\s+property="og:[^"]+"\s+content="[^"]*"\s*\/?>\s*/g, "")
    .replace(/<meta\s+name="twitter:[^"]+"\s+content="[^"]*"\s*\/?>\s*/g, "")
    .replace(/<meta\s+property="og:image:width"\s+content="[^"]*"\s*\/?>\s*/g, "")
    .replace(/<meta\s+property="og:image:height"\s+content="[^"]*"\s*\/?>\s*/g, "");

  const metaTags = `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Vibez Citizens" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  `.trim();

  html = html.includes("<head>")
    ? html.replace("<head>", `<head>\n${metaTags}\n`)
    : `${metaTags}\n${html}`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
