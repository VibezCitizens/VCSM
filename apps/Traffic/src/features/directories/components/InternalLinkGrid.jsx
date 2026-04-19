import Link from "next/link";

export function InternalLinkGrid({ title, links }) {
  if (!links.length) {
    return null;
  }

  return (
    <section className="card stack-grid">
      <h3 className="homepage-card-title">{title}</h3>
      <ul className="link-grid">
        {links.map((link) => (
          <li key={`${link.href}::${link.secondaryHref ?? ""}`}>
            <Link className="link-grid-primary" href={link.href}>
              <span>{link.label}</span>
              {link.description ? (
                <span className="link-grid-description text-xs text-muted">
                  {link.description}
                </span>
              ) : null}
            </Link>
            {link.secondaryHref && link.secondaryLabel ? (
              <Link className="link-grid-secondary text-xs" href={link.secondaryHref}>
                {link.secondaryLabel}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
