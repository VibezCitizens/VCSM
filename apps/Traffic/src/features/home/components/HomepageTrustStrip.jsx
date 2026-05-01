export default function HomepageTrustStrip({ signals }) {
  if (!signals.length) {
    return (
      <section className="homepage-section homepage-section--divider homepage-trust-strip" id="stats">
        <div className="homepage-section-heading">
          <h2 className="section-title">Stats</h2>
          <p>Live marketplace metrics.</p>
        </div>
        <p className="homepage-meta-note">No live metrics available yet.</p>
      </section>
    );
  }

  return (
    <section className="homepage-section homepage-section--divider homepage-trust-strip" id="stats">
      <div className="homepage-section-heading">
        <h2 className="section-title">Stats</h2>
        <p>Live marketplace metrics.</p>
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
