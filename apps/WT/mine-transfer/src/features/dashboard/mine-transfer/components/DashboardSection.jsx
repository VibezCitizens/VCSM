export default function DashboardSection({ eyebrow, title, description, action, children, className = "" }) {
  return (
    <section className={`mt-section ${className}`.trim()}>
      <div className="mt-section__header">
        <div>
          {eyebrow ? <span className="mt-eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="mt-section__action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
