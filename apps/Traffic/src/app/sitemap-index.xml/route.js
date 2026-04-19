import { listSitemapChunks } from "@/data/repositories/pageCandidate.repo";
import { buildCanonical } from "@/seo/canonical";

export async function GET() {
  const chunks = await listSitemapChunks();
  const entries = chunks
    .map((chunk) => {
      const loc = buildCanonical(`/sitemaps/${chunk.chunk}`);
      const lastmod = chunk.updatedAt ?? chunk.urls[0]?.updatedAt ?? "2026-01-01T00:00:00.000Z";

      return `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
