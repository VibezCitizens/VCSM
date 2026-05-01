import Link from "next/link";

export default function HomepageTrendingSection({ groups }) {
  return (
    <section className="homepage-section homepage-section--divider homepage-trending-section homepage-directory-surface-soft" id="browse">
      <div className="homepage-section-heading">
        <h2 className="section-title">Popular searches</h2>
        <p>Useful directory shortcuts by need, service type, and city.</p>
      </div>

      <div className="homepage-trending-groups">
        {groups.map((group) => (
          <article key={group.title} className="homepage-trending-group">
            <div className="homepage-trending-group-head">
              <h3 className="homepage-trending-title">{group.title}</h3>
              <p className="homepage-meta-note">{group.description}</p>
            </div>

            <ul className="homepage-directory-links">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.label}`}>
                  <Link className="homepage-directory-link" href={link.href}>
                    <span>{link.label}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
