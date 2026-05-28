"use client";

import { useTrafficLanguage } from "@/lib/language";
import { trackProviderAction } from "@/lib/analytics";

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

function buildDirectionsUrl(lat, lng, address, locationText) {
  const query = (lat != null && lng != null)
    ? `${lat},${lng}`
    : encodeURIComponent(
        [address?.street, address?.city, address?.state]
          .filter(Boolean)
          .join(", ") || locationText || ""
      );
  if (!query) return null;
  return `https://maps.google.com/?q=${query}`;
}

export function ContactSection({
  providerSlug,
  providerSource,
  phone,
  address,
  locationText,
  cityName,
  regionCode,
  postalCode,
  email,
  websiteUrl,
  bookingUrl,
  lat,
  lng
}) {
  const { t } = useTrafficLanguage();

  const addressLines = buildAddressLines(address, locationText, cityName, regionCode, postalCode);
  const hasPhone = Boolean(phone);
  const hasAddress = addressLines.length > 0;
  const hasEmail = Boolean(email);
  const hasWebsite = Boolean(websiteUrl);
  const hasBooking = Boolean(bookingUrl);
  const directionsUrl = buildDirectionsUrl(lat, lng, address, locationText);
  const hasDirections = Boolean(directionsUrl) && hasAddress;

  if (!hasPhone && !hasAddress && !hasEmail && !hasWebsite && !hasBooking) return null;

  return (
    <section
      className="card card--subtle pro-contact"
      aria-label={t("providerProfile.contactInformation")}
    >
      <h2 className="pro-section-title">
        {t("providerProfile.contact")}
      </h2>
      <ul className="pro-contact-list">
        {hasPhone ? (
          <li className="pro-contact-row">
            <span className="pro-contact-label">
              {t("common.phone")}
            </span>
            <a
              href={`tel:${phone}`}
              className="pro-contact-value pro-contact-link"
              onClick={() =>
                trackProviderAction({ action: "contact_phone_click", providerSlug, providerSource })
              }
            >
              {formatPhone(phone)}
            </a>
          </li>
        ) : null}
        {hasEmail ? (
          <li className="pro-contact-row">
            <span className="pro-contact-label">
              {t("common.email")}
            </span>
            <a
              href={`mailto:${email}`}
              className="pro-contact-value pro-contact-link"
              onClick={() =>
                trackProviderAction({ action: "contact_email_click", providerSlug, providerSource })
              }
            >
              {email}
            </a>
          </li>
        ) : null}
        {hasWebsite ? (
          <li className="pro-contact-row">
            <span className="pro-contact-label">
              {t("common.website")}
            </span>
            <a
              href={websiteUrl}
              className="pro-contact-value pro-contact-link"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => trackProviderAction({ action: "website_click", providerSlug, providerSource })}
            >
              {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          </li>
        ) : null}
        {hasBooking ? (
          <li className="pro-contact-row">
            <span className="pro-contact-label">
              {t("common.booking")}
            </span>
            <a
              href={bookingUrl}
              className="pro-contact-value pro-contact-link"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => trackProviderAction({ action: "booking_click", providerSlug, providerSource })}
            >
              {t("providerProfile.bookOnline")}
            </a>
          </li>
        ) : null}
        {hasAddress ? (
          <li className="pro-contact-row">
            <span className="pro-contact-label">
              {t("common.address")}
            </span>
            <address className="pro-contact-value pro-contact-address">
              {addressLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </li>
        ) : null}
        {hasDirections ? (
          <li className="pro-contact-row">
            <span className="pro-contact-label" />
            <a
              href={directionsUrl}
              className="pro-contact-value pro-contact-link pro-contact-directions"
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => trackProviderAction({ action: "directions_click", providerSlug, providerSource })}
            >
              {t("providerProfile.getDirections")}
            </a>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
