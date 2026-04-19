import Link from "next/link";

export default function HomepageGuidesPreviewSection({ items }) {
  return (
    <section className="card homepage-section homepage-guides-section">
      <div className="homepage-section-heading">
        <h2 className="section-title">TRAZE Guides & Resources</h2>
        <p>Safety guides, emergency checklists, and booking advice from the TRAZE network.</p>
      </div>

      <div className="homepage-guides-grid">
        {items.map((item) => (
          <article key={item.title} className="homepage-card homepage-guide-card">
            <div className="homepage-card-top">
              <h3 className="homepage-card-title">{item.title}</h3>
              <span className="pill">{item.tag}</span>
            </div>
            <p className="text-sm">{item.summary}</p>
            {item.meta ? <p className="text-xs text-muted">{item.meta}</p> : null}
            {item.href ? (
              <Link className="pill fit-width" href={item.href}>
                Read on TRAZE
              </Link>
            ) : (
              <span className="pill fit-width">Coming to TRAZE soon</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
