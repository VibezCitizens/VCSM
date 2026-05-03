// functions/sitemaps/vport-cards.xml.js
// Cloudflare Pages Function — serves /sitemaps/vport-cards.xml
// Lists all published VPORT business card pages.
//
// Required Cloudflare Pages env vars:
//   SUPABASE_URL       — e.g. https://xyzxyz.supabase.co
//   SUPABASE_ANON_KEY  — public anon key
//
// Falls back to an empty but valid sitemap if the Supabase call fails.
// RLS note: the anon role must have SELECT on vport.profiles for this query
// to return rows. If RLS blocks it, the sitemap will be empty but still valid.

const SITE_ORIGIN = 'https://vibezcitizens.com';

export async function onRequest(context) {
  const { env } = context;

  let rows = [];

  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      rows = await fetchAllPages(env, 'profiles', 'slug=not.is.null&business_card_published=eq.true&is_active=eq.true&is_deleted=eq.false&select=slug,updated_at');
    } catch {
      // Network timeout or Supabase error — return empty sitemap
    }
  }

  const entries = rows
    .filter((r) => r.slug)
    .map((r) => {
      const lastmod = r.updated_at ? r.updated_at.slice(0, 10) : null;
      return [
        '  <url>',
        `    <loc>${escapeXml(`${SITE_ORIGIN}/vport/${r.slug}/card`)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
      ].filter(Boolean).join('\n');
    });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

async function fetchAllPages(env, table, query) {
  const PAGE_SIZE = 1000;
  const all = [];
  let offset = 0;

  while (true) {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/${table}?${query}&limit=${PAGE_SIZE}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          'Accept-Profile': 'vport',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) break;
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

function escapeXml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
