// functions/sitemaps/wanderex-profiles.xml.js
// Cloudflare Pages Function — serves /sitemaps/wanderex-profiles.xml
// Lists public WanderEx profile and booking entry routes.

const SITE_ORIGIN = "https://vibezcitizens.com";

export async function onRequest(context) {
  const { env } = context;
  let rows = [];

  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      rows = await fetchAllPages(env, 'profiles', 'slug=not.is.null&is_active=eq.true&is_deleted=eq.false&directory_visible=eq.true&directory_status=eq.listed&select=slug,updated_at');
    } catch (err) {
      console.error('[sitemap:wanderex-profiles] Supabase error:', err?.message ?? String(err));
    }
  }

  const entries = rows
    .filter((row) => row.slug)
    .flatMap((row) => {
      const lastmod = row.updated_at ? String(row.updated_at).slice(0, 10) : null;

      return [
        {
          loc: `${SITE_ORIGIN}/p/${row.slug}`,
          changefreq: "weekly",
          priority: "0.9",
          lastmod,
        },
        {
          loc: `${SITE_ORIGIN}/p/${row.slug}/book`,
          changefreq: "weekly",
          priority: "0.8",
          lastmod,
        },
      ];
    })
    .map(({ loc, changefreq, priority, lastmod }) =>
      [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n")
    );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
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
        method: "GET",
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          "Accept-Profile": "vport",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
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

function escapeXml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
