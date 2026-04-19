import Link from "next/link";

export default function HomepageQuickActions({ actions }) {
  return (
    <section className="card homepage-section homepage-quick-actions-wrap">
      <div className="homepage-section-heading">
        <h2 className="section-title">TRAZE Quick Actions</h2>
        <p>Jump straight to common local service intents.</p>
      </div>

      <div className="homepage-quick-actions">
        {actions.map((action) =>
          action.external ? (
            <a
              key={action.label}
              className="pill pill--ghost homepage-quick-chip"
              href={action.href}
              target="_blank"
              rel="noreferrer"
            >
              {action.label}
            </a>
          ) : (
            <Link key={action.label} className="pill pill--ghost homepage-quick-chip" href={action.href}>
              {action.label}
            </Link>
          )
        )}
      </div>
    </section>
  );
}
