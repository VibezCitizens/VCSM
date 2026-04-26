function formatPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function buildAddressLines(address, locationText, cityName, regionCode, postalCode) {
  if (!address || typeof address !== "object") {
    return locationText ? [locationText] : [];
  }

  const street = String(address.street ?? address.address_line1 ?? "").trim();
  const city = String(address.city ?? cityName ?? "").trim();
  const state = String(address.state ?? regionCode ?? "").trim();
  const zip = String(address.postal_code ?? address.zip ?? postalCode ?? "").trim();

  const lines = [];
  if (street) lines.push(street);

  const cityLine = [city, state, zip].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);

  if (!lines.length && locationText) lines.push(locationText);

  return lines;
}

export function ContactSection({ phone, address, locationText, cityName, regionCode, postalCode }) {
  const addressLines = buildAddressLines(address, locationText, cityName, regionCode, postalCode);
  const hasPhone = Boolean(phone);
  const hasAddress = addressLines.length > 0;

  if (!hasPhone && !hasAddress) return null;

  return (
    <section className="card card--subtle pro-contact" aria-label="Contact information">
      <h2 className="pro-section-title">Contact</h2>
      <ul className="pro-contact-list">
        {hasPhone ? (
          <li className="pro-contact-row">
            <span className="pro-contact-label">Phone</span>
            <a
              href={`tel:${phone}`}
              className="pro-contact-value pro-contact-link"
            >
              {formatPhone(phone)}
            </a>
          </li>
        ) : null}
        {hasAddress ? (
          <li className="pro-contact-row">
            <span className="pro-contact-label">Address</span>
            <address className="pro-contact-value pro-contact-address">
              {addressLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
