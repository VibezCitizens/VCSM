#!/usr/bin/env node
/**
 * assert-no-phantom-links.mjs — TRAZE build-output phantom-link guard.
 *
 * Walks the static export in out/, extracts every internal <a href>, and
 * resolves each to its expected static output file. Exits non-zero (and prints
 * source file → href → expected file) if any internal link points at a page the
 * export never generated. Catches the TICKET-TRAZE-PHANTOM-LINKS-001 class of
 * regression where UI/renderers link to pages generateStaticParams() never made.
 *
 * Usage (run AFTER `next build`):
 *   node scripts/assert-no-phantom-links.mjs
 *   npm run audit:phantom-links
 *
 * Optional: pass a custom out dir as argv[2]. Read-only; never writes.
 * Not wired into the production build (no postbuild convention in this app) —
 * run it manually or in CI after the export completes.
 */
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.argv[2] ?? join(HERE, "..", "out"));

// Directories under out/ that hold assets, not navigable HTML pages.
const SKIP_DIRS = new Set(["_next", "geo", "icons"]);
const ASSET_EXT = /\.(png|jpe?g|svg|ico|webp|gif|css|js|mjs|json|xml|txt|woff2?|ttf|map|webmanifest|pdf)$/i;

if (!existsSync(OUT)) {
  console.error(`[phantom-links] out/ directory not found at ${OUT}. Run \`next build\` first.`);
  process.exit(2);
}

function walkHtml(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walkHtml(full, acc);
    } else if (entry.endsWith(".html")) {
      acc.push(full);
    }
  }
  return acc;
}

// Map an internal pathname to whether a static file backs it.
function resolves(pathname) {
  const rel = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!rel) return existsSync(join(OUT, "index.html"));
  return (
    existsSync(join(OUT, rel)) ||            // direct file (sitemap.xml, robots.txt, *.txt)
    existsSync(join(OUT, `${rel}.html`)) ||  // /a/b -> a/b.html
    existsSync(join(OUT, rel, "index.html")) // /a/b -> a/b/index.html
  );
}

function isInternalNavigable(href) {
  if (!href || typeof href !== "string") return false;
  if (!href.startsWith("/")) return false;       // external / mailto: / tel: / # / relative
  if (href.startsWith("//")) return false;        // protocol-relative external
  if (href.startsWith("/_next")) return false;    // build assets
  return true;
}

const files = walkHtml(OUT);
const hrefRe = /href="(\/[^"#]*?)"/g;

const broken = new Map(); // pathname -> { count, sources:Set, expected }
let totalInternal = 0;

for (const file of files) {
  const html = readFileSync(file, "utf8");
  let m;
  while ((m = hrefRe.exec(html))) {
    const href = m[1];
    if (!isInternalNavigable(href)) continue;
    const pathname = href.split("?")[0].split("#")[0]; // ignore query + hash
    if (!pathname || pathname === "/") continue;
    if (ASSET_EXT.test(pathname)) continue;
    totalInternal++;
    if (!resolves(pathname)) {
      const rec = broken.get(pathname) ?? {
        count: 0,
        sources: new Set(),
        expected: `out${pathname}.html (or ${pathname}/index.html)`
      };
      rec.count++;
      if (rec.sources.size < 6) rec.sources.add(relative(OUT, file));
      broken.set(pathname, rec);
    }
  }
}

const brokenOccurrences = [...broken.values()].reduce((a, r) => a + r.count, 0);

console.log(`[phantom-links] HTML pages scanned:        ${files.length}`);
console.log(`[phantom-links] internal links scanned:    ${totalInternal}`);
console.log(`[phantom-links] unique broken targets:     ${broken.size}`);
console.log(`[phantom-links] broken link occurrences:   ${brokenOccurrences}`);

if (broken.size === 0) {
  console.log("[phantom-links] OK — no internal link points at a missing static page.");
  process.exit(0);
}

console.error("\n[phantom-links] FAIL — phantom internal links found:\n");
for (const [pathname, rec] of [...broken.entries()].sort((a, b) => b[1].count - a[1].count)) {
  console.error(`  ✗ ${pathname}  (${rec.count}x)`);
  console.error(`      expected output: ${rec.expected}`);
  console.error(`      linked from:     ${[...rec.sources].join(", ")}`);
}
process.exit(1);
