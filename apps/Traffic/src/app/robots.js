import { getSiteOrigin } from "@/lib/env";

export const dynamic = "force-static";

export default function robots() {
  const siteOrigin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteOrigin}/sitemap-index.xml`,
  };
}
