// functions/sitemap.xml.js
// Cloudflare Pages Function — serves /sitemap.xml as a sitemap index.
// All sub-sitemaps are listed here. Crawlers fetch each one separately.
//
// No env vars required — this file contains no dynamic data.

const SITEMAPS = [
  '/sitemaps/static.xml',
  '/sitemaps/vport-menu.xml',
  '/sitemaps/vport-reviews.xml',
  '/sitemaps/vport-cards.xml',
];

export async function onRequest(context) {
  const { request } = context;
  const origin = new URL(request.url).origin;

  const entries = SITEMAPS.map(
    (path) => `  <sitemap>\n    <loc>${escapeXml(`${origin}${path}`)}</loc>\n  </sitemap>`
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</sitemapindex>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

function escapeXml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
