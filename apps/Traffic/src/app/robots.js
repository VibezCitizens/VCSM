import { getSiteOrigin } from "@/lib/env";

export const dynamic = "force-static";

export default function robots() {
  const siteOrigin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /search is a parallel, noindex interactive layer — keep it out of the
        // index and prevent infinite crawlable query-string pages (TRAZE-SEARCH-004).
        disallow: ["/api/", "/search", "/en/search", "/es/search"],
      },
    ],
    sitemap: `${siteOrigin}/sitemap-index.xml`,
  };
}
