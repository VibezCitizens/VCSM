// functions/sitemaps/vport-reviews.xml.js
// Cloudflare Pages Function — serves /sitemaps/vport-reviews.xml
// Lists public review pages for all active VPORTs with a slug.
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
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles` +
          `?slug=not.is.null` +
          `&is_active=eq.true` +
          `&is_deleted=eq.false` +
          `&select=slug,updated_at` +
          `&limit=1000`,
        {
          method: 'GET',
          headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
            'Accept-Profile': 'vport',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        rows = Array.isArray(data) ? data : [];
      }
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
        `    <loc>${escapeXml(`${SITE_ORIGIN}/profile/${r.slug}/reviews`)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.6</priority>',
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

function escapeXml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
