import { getSitemapChunk, listSitemapChunks } from "@/data/repositories/pageCandidate.repo";
import { buildCanonical } from "@/seo/canonical";

export async function generateStaticParams() {
  const chunks = await listSitemapChunks();
  return chunks.map((entry) => ({ chunk: entry.chunk }));
}

export async function GET(request, { params }) {
  const chunkData = await getSitemapChunk(params.chunk);

  if (!chunkData) {
    return new Response("Not found", { status: 404 });
  }

  const urls = chunkData.urls
    .map(
      (page) =>
        `  <url>\n    <loc>${buildCanonical(page.path)}</loc>\n    <lastmod>${page.updatedAt}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
