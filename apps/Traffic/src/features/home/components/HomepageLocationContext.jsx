import Link from "next/link";

export default function HomepageLocationContext({
  currentLocationLabel,
  nearbyOptions,
  isLocationSpecific = true
}) {
  const headline = isLocationSpecific
    ? `Available now in ${currentLocationLabel}.`
    : "Providers on TRAZE.";

  return (
    <section className="homepage-section homepage-section--divider homepage-location-block" id="location-strip">
      <div className="homepage-section-heading">
        <h2 className="section-title">Location</h2>
        <p>{headline}</p>
      </div>

      <div className="homepage-location-row">
        <span className="pill pill--ok">
          {isLocationSpecific ? `Available now: ${currentLocationLabel}` : "Live directory view"}
        </span>
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
