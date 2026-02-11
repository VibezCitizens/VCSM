// functions/wanders/c/[id].js
export async function onRequest(context) {
  const { params, env } = context;
  const id = params.id;

  // Your real domain
  const PUBLIC_ORIGIN = "https://vibezcitizens.com";

  // The actual route your app uses for viewing the card
  const url = `${PUBLIC_ORIGIN}/wanders/c/${id}`;

  // ✅ Your existing public OG image
  const image = `${PUBLIC_ORIGIN}/og/wanders-envelope.jpeg`;

  // Simple copy (you can personalize later)
  const title = `💌 A Wanders Card`;
  const description = `Someone made you a Vibez Citizens card. Tap to open.`;

  // ✅ Fetch the built index.html from Pages static assets
  const indexRes = await env.ASSETS.fetch(new Request("https://dummy/index.html"));
  if (!indexRes || indexRes.status !== 200) {
    return new Response("index.html not found", { status: 500 });
  }

  let html = await indexRes.text();

  // Remove existing OG/Twitter tags to avoid duplicates
  html = html.replace(
    /<meta\s+(property|name)=["'](og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi,
    ""
  );

  // Inject fresh OG/Twitter tags before </head>
  const tags = `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Vibez Citizens" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />

    <link rel="canonical" href="${escapeHtml(url)}" />
  `.trim();

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${tags}\n</head>`);
  } else {
    html = `${tags}\n${html}`;
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
