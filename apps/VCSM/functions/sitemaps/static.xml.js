// functions/sitemaps/static.xml.js
// Cloudflare Pages Function — serves /sitemaps/static.xml
// Static public pages only — no auth, no DB lookup.
// Do NOT add login/register/settings or any protected routes here.

const STATIC_URLS = [
  { loc: 'https://vibezcitizens.com/about',                    changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://vibezcitizens.com/contact',                  changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://vibezcitizens.com/how-to/create-profile',    changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://vibezcitizens.com/how-to/create-vport',      changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://vibezcitizens.com/legal/privacy-policy',     changefreq: 'yearly',  priority: '0.3' },
  { loc: 'https://vibezcitizens.com/legal/terms-of-service',   changefreq: 'yearly',  priority: '0.3' },
];

export async function onRequest() {
  const entries = STATIC_URLS.map(({ loc, changefreq, priority }) =>
    [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n')
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // Static pages change rarely — cache for 24 hours
      'cache-control': 'public, max-age=86400',
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
