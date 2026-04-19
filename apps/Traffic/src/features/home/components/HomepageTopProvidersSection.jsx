import Link from "next/link";

export default function HomepageTopProvidersSection({ providers }) {
  return (
    <section className="card homepage-section">
      <div className="homepage-section-heading">
        <h2 className="section-title">Top TRAZE Providers Near You</h2>
        <p>Recently active businesses with strong trust and response signals.</p>
      </div>

      <div className="homepage-grid-providers homepage-grid-providers--top">
        {providers.map((provider) => (
          <article key={provider.id} className="homepage-card homepage-provider-card homepage-provider-card--top">
            <div className="homepage-card-top">
              <h3 className="homepage-provider-title">{provider.name}</h3>
              <span className={`pill ${provider.verified ? "pill--ok" : ""}`}>
                {provider.verified ? "Verified" : "Listed"}
              </span>
            </div>

            <p className="homepage-provider-summary">{provider.category}</p>
            <p className="homepage-meta-note">{provider.cityLabel}</p>

            <div className="homepage-chip-row">
              <span className="pill">Rating {provider.rating}</span>
              <span className="pill">{provider.reviewCount} reviews</span>
              <span className="pill">Responds in ~{provider.responseMinutes}m</span>
            </div>

            <Link className="pill" href={provider.href}>
              View profile
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
