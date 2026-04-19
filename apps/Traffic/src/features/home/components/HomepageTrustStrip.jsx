export default function HomepageTrustStrip({ signals }) {
  return (
    <section className="card homepage-section homepage-trust-strip">
      <div className="homepage-section-heading">
        <h2 className="section-title">Why Users Trust TRAZE</h2>
        <p>Meaningful quality indicators from active TRAZE provider activity.</p>
      </div>

      <div className="homepage-trust-grid">
        {signals.map((signal) => (
          <article key={signal.label} className="homepage-card homepage-trust-card">
            <p className="homepage-trust-value">{signal.value}</p>
            <p className="homepage-meta-note">{signal.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
