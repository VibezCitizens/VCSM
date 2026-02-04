// server/server.js
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Your real domain
const PUBLIC_ORIGIN = "https://vibezcitizens.com";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite build output folder
const DIST_DIR = path.resolve(__dirname, "../dist");
const INDEX_HTML_PATH = path.join(DIST_DIR, "index.html");

// Serve built assets (JS/CSS/icons/etc)
app.use(express.static(DIST_DIR, { index: false }));

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildLovedropMetaTags({ url, title, description, image }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(url);
  const i = escapeHtml(image);

  return `
    <!-- Lovedrop OG -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Vibez Citizens" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Lovedrop Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />
  `.trim();
}

function injectMetaIntoHead(indexHtml, metaTags) {
  // Remove existing OG/Twitter tags (avoid duplicates)
  const cleaned = indexHtml
    .replace(/<meta\s+property="og:[^"]+"\s+content="[^"]*"\s*\/?>\s*/g, "")
    .replace(/<meta\s+name="twitter:[^"]+"\s+content="[^"]*"\s*\/?>\s*/g, "")
    .replace(/<meta\s+property="og:image:width"\s+content="[^"]*"\s*\/?>\s*/g, "")
    .replace(/<meta\s+property="og:image:height"\s+content="[^"]*"\s*\/?>\s*/g, "");

  if (cleaned.includes("<head>")) {
    return cleaned.replace("<head>", `<head>\n${metaTags}\n`);
  }
  return `${metaTags}\n${cleaned}`;
}

// TODO: Replace this with real data fetch (Supabase/DB/etc)
async function getLovedropById(id) {
  return null;
}

// ✅ Link preview route
app.get("/lovedrop/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const lovedrop = await getLovedropById(id);

    const toName = lovedrop?.toName?.trim() || "someone";
    const title = `💌 A LoveDrop for ${toName}`;

    const description = lovedrop?.messageText
      ? String(lovedrop.messageText).trim().slice(0, 140)
      : "Someone sent you something sweet. Tap to open.";

    const url = `${PUBLIC_ORIGIN}/lovedrop/${id}`;
    const image =
      "https://cdn.vibezcitizens.com/og/vibez-citizens-1200x630.png";

    if (!fs.existsSync(INDEX_HTML_PATH)) {
      return res
        .status(500)
        .send("dist/index.html not found. Run: npm run build");
    }

    const indexHtml = fs.readFileSync(INDEX_HTML_PATH, "utf-8");
    const metaTags = buildLovedropMetaTags({ url, title, description, image });
    const htmlWithMeta = injectMetaIntoHead(indexHtml, metaTags);

    res.status(200).set("Content-Type", "text/html").send(htmlWithMeta);
  } catch (err) {
    next(err);
  }
});

// ✅ Express 5-safe SPA fallback (regex, no path-to-regexp wildcard parsing)
app.get(/.*/, (req, res) => {
  res.sendFile(INDEX_HTML_PATH);
});

app.listen(PORT, () => {
  console.log(`✅ Vibez server running on http://localhost:${PORT}`);
});
