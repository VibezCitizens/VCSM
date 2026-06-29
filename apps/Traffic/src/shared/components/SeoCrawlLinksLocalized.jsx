"use client";

// Locale-aware client variant of SeoCrawlLinks for surfaces that are otherwise
// localized (e.g. /es/categories). TICKET-TRAZE-CATEGORIES-CRAWL-LOCALE-001.
//
// SEO invariant preserved: LanguageProvider starts at "en" and only reconciles
// the route locale in a post-mount effect, so the SERVER-RENDERED HTML (and the
// first client render) is English for every locale — crawlers still see English
// crawl links with lang="en", exactly like SeoCrawlLinks. After hydration on an
// /es route the visible label swaps to Spanish. hrefs are identical in both
// languages (never localized), so discoverability is unchanged.
//
// groups: Array<{ heading?, headingEs?, links: Array<{ href, label, labelEs? }> }>
import { useTrafficLanguage } from "@/lib/language";

function pick(lang, en, es) {
  return lang === "es" && es ? es : en;
}

export default function SeoCrawlLinksLocalized({ title, titleEs, groups = [], muted = false }) {
  const { lang } = useTrafficLanguage();

  const visibleGroups = groups.filter(
    (group) => Array.isArray(group.links) && group.links.length > 0
  );

  if (!visibleGroups.length) {
    return null;
  }

  const heading = pick(lang, title, titleEs);

  // `muted` renders a de-emphasized footer-style block (smaller, dimmer, no card
  // surface). The links themselves are unchanged real SSR <a> elements, so the
  // crawlable internal-link graph is preserved — only visual prominence drops.
  const sectionClass = muted
    ? "seo-crawl-block seo-crawl-block--muted"
    : "homepage-section homepage-section--divider homepage-directory-surface-soft traze-page-card";

  return (
    <section className={sectionClass} aria-label={heading}>
      {heading ? <h2 className="section-title">{heading}</h2> : null}

      {visibleGroups.map((group, index) => (
        <div key={group.heading ?? index} className="seo-crawl-group">
          {group.heading ? (
            <h3 className="homepage-card-title">{pick(lang, group.heading, group.headingEs)}</h3>
          ) : null}
          <ul className="seo-crawl-list">
            {group.links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{pick(lang, link.label, link.labelEs)}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
