import Link from "next/link";

/**
 * TrazeSection — generic content section for directory hub pages.
 * Server-safe (no hooks).
 *
 * Props:
 *   title     string   — section label (shown as eyebrow/uppercase)
 *   href      string?  — optional "view all" link
 *   linkLabel string?  — label for the view-all link
 *   className string?  — additional class on the <section>
 *   children  ReactNode
 */
export function TrazeSection({ title, href, linkLabel, className, children }) {
  const sectionClass = className ? `traze-section ${className}` : "traze-section";

  return (
    <section className={sectionClass}>
      {(title || href) && (
        <div className="traze-section-header">
          {title && <h2 className="traze-section-title">{title}</h2>}
          {href && linkLabel && (
            <Link className="traze-section-link" href={href}>
              {linkLabel}
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
