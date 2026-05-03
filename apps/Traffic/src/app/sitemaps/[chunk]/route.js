import { getSitemapChunk, listSitemapChunks, listPageCandidates } from "@/data/repositories/pageCandidate.repo";
import { buildCanonical } from "@/seo/canonical";

const CHUNK_SIZE = 5000;

// Sync — uses only static in-memory data so the build never depends on Supabase availability.
// The GET handler still includes content pages when they are available at render time.
export function generateStaticParams() {
  const pages = listPageCandidates({ includeLegacy: false });
  const chunkCount = Math.max(1, Math.ceil(pages.length / CHUNK_SIZE));
  return Array.from({ length: chunkCount }, (_, i) => ({ chunk: `chunk-${i + 1}.xml` }));
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
