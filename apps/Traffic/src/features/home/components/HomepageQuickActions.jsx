import Link from "next/link";

export default function HomepageQuickActions({ actions }) {
  return (
    <section className="homepage-section homepage-section--divider homepage-quick-actions-wrap" id="quick-actions">
      <div className="homepage-section-heading">
        <h2 className="section-title">Quick actions</h2>
        <p>Open common booking routes in one tap.</p>
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
