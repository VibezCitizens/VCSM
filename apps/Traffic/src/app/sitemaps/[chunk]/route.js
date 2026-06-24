import {
  getSitemapChunk,
  listPageCandidatesWithAnswers,
  listSitemapChunks
} from "@/data/repositories/pageCandidate.repo";
import { buildCanonical } from "@/seo/canonical";
import { listLocalizedSitemapPaths } from "@/seo/locale";

export const dynamic = "force-static";

const CHUNK_SIZE = 5000;

export async function generateStaticParams() {
  const pages = await listPageCandidatesWithAnswers({ includeLegacy: false });
  const chunkCount = Math.max(1, Math.ceil(pages.length / CHUNK_SIZE));
  return Array.from({ length: chunkCount }, (_, i) => ({ chunk: `chunk-${i + 1}.xml` }));
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request, { params }) {
  const { chunk } = await params;
  const chunkData = await getSitemapChunk(chunk);

  if (!chunkData) {
    return new Response("Not found", { status: 404 });
  }

  const urls = chunkData.urls
    .flatMap((page) =>
      listLocalizedSitemapPaths(page.path).map((localized) => ({
        ...page,
        path: localized.path,
        basePath: page.path
      }))
    )
    .map(
      (page) =>
        `  <url>\n    <loc>${escapeXml(buildCanonical(page.path))}</loc>\n    <lastmod>${escapeXml(page.updatedAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`
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
