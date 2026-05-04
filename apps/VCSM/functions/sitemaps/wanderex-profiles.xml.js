// functions/sitemaps/wanderex-profiles.xml.js
// Cloudflare Pages Function — serves /sitemaps/wanderex-profiles.xml
// Lists public WanderEx profile and booking entry routes for directory-visible VPORTs.
//
// Required Cloudflare Pages env vars:
//   SUPABASE_URL       — e.g. https://xyzxyz.supabase.co
//   SUPABASE_ANON_KEY  — public anon key (vport schema must be in PostgREST exposed schemas)
//
// RLS note: "Public can read listed VPORT profiles" allows anon SELECT on
// directory_visible=true AND directory_status=listed rows. Query filters match.

const SITE_ORIGIN = 'https://vibezcitizens.com';
const LOG = '[sitemap:wanderex-profiles]';

export async function onRequest(context) {
  try {
    return await buildSitemap(context.env);
  } catch (err) {
    console.error(LOG, 'fatal:', String(err));
    return xmlFallback();
  }
}

async function buildSitemap(env) {
  const hasConfig = !!(env?.SUPABASE_URL && env?.SUPABASE_ANON_KEY);
  console.log(LOG, 'config present:', hasConfig);

  let rows = [];
  let fetchError = null;

  if (hasConfig) {
    try {
      rows = await fetchAllPages(
        env,
        'profiles',
        'slug=not.is.null&is_active=eq.true&is_deleted=eq.false&directory_visible=eq.true&directory_status=eq.listed&select=slug,updated_at'
      );
      console.log(LOG, 'rows fetched:', rows.length);
    } catch (err) {
      fetchError = err?.message ?? String(err);
      console.error(LOG, 'Supabase error:', fetchError);
    }
  }

  const entries = rows
    .filter((row) => row.slug)
    .flatMap((row) => {
      const lastmod = row.updated_at ? String(row.updated_at).slice(0, 10) : null;
      return [
        { loc: `${SITE_ORIGIN}/p/${row.slug}`,       changefreq: 'weekly', priority: '0.9', lastmod },
        { loc: `${SITE_ORIGIN}/p/${row.slug}/book`,  changefreq: 'weekly', priority: '0.8', lastmod },
      ];
    })
    .map(({ loc, changefreq, priority, lastmod }) =>
      [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].filter(Boolean).join('\n')
    );

  console.log(LOG, 'urls emitted:', entries.length);

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    !hasConfig ? '<!-- config-missing: SUPABASE_URL or SUPABASE_ANON_KEY not set -->' : null,
    fetchError ? '<!-- fetch-error: data-unavailable -->' : null,
    entries.length === 0 && hasConfig && !fetchError ? '<!-- zero-results: no directory-visible listed VPORTs found -->' : null,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].filter(Boolean);

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': entries.length > 0 ? 'public, max-age=3600' : 'no-store',
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

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

function xmlFallback() {
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>\n<!-- sitemap error: internal-error -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    {
      status: 500,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
}

function escapeXml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
