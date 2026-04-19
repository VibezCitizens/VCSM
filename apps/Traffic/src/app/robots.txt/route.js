import { buildCanonical } from "@/seo/canonical";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /pro/",
    "",
    `Sitemap: ${buildCanonical("/sitemap-index.xml")}`
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
