import Link from "next/link";

export default function HomepageTrendingSection({ groups }) {
  return (
    <section className="card homepage-section">
      <div className="homepage-section-heading">
        <h2 className="section-title">Popular TRAZE Searches</h2>
        <p>Trending intents that help users discover providers faster.</p>
      </div>

      <div className="homepage-trending-grid">
        {groups.map((group) => (
          <article key={group.title} className="homepage-card homepage-trending-card">
            <h3 className="homepage-card-title">{group.title}</h3>
            <p className="homepage-meta-note">{group.description}</p>
            <div className="homepage-chip-row">
              {group.links.map((link) => (
                <Link key={`${group.title}-${link.label}`} className="pill" href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
