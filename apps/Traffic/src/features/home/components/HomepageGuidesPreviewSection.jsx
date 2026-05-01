import Link from "next/link";

export default function HomepageGuidesPreviewSection({ items }) {
  return (
    <section className="homepage-section homepage-section--divider homepage-guides-section" id="before-you-book">
      <div className="homepage-section-heading">
        <h2 className="section-title">Before you book</h2>
        <p>Quick checks before you confirm.</p>
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
                Read guide
              </Link>
            ) : (
              <span className="pill fit-width">Guide coming soon</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
