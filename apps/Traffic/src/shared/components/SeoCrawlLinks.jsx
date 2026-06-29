// Server component (no "use client"): renders crawlable SSR <a> links so
// category / country / provider navigation is discoverable in the static export
// HTML without any client interaction (TICKET-TRAZE-SEO-CRAWLABILITY-001).
//
// English labels are intentional — Traffic SSR HTML is English for all locales
// (LanguageProvider is client-only), matching the lang="en" SEO invariant.
//
// groups: Array<{ heading?: string, links: Array<{ href: string, label: string }> }>
export default function SeoCrawlLinks({ title, groups = [] }) {
  const visibleGroups = groups.filter(
    (group) => Array.isArray(group.links) && group.links.length > 0
  );

  if (!visibleGroups.length) {
    return null;
  }

  return (
    <section
      className="homepage-section homepage-section--divider homepage-directory-surface-soft traze-page-card"
      aria-label={title}
    >
      {title ? <h2 className="section-title">{title}</h2> : null}

      {visibleGroups.map((group, index) => (
        <div key={group.heading ?? index} className="seo-crawl-group">
          {group.heading ? (
            <h3 className="homepage-card-title">{group.heading}</h3>
          ) : null}
          <ul className="seo-crawl-list">
            {group.links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
