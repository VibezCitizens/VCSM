import Link from "next/link";

export default function HomepageLocationContext({ currentLocationLabel, nearbyOptions }) {
  return (
    <section className="card homepage-section homepage-location-block">
      <div className="homepage-section-heading">
        <h2 className="section-title">Explore TRAZE Providers In Your Area</h2>
        <p>Showing TRAZE results near {currentLocationLabel}.</p>
      </div>

      <div className="homepage-location-row">
        <span className="pill pill--ok">Showing TRAZE results near {currentLocationLabel}</span>
        <button className="pill pill--ghost" type="button" aria-label="Change location preference">
          Change location
        </button>
      </div>

      <div className="homepage-chip-row">
        {nearbyOptions.map((option) => (
          <Link key={option.label} className="pill" href={option.href}>
            {option.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
