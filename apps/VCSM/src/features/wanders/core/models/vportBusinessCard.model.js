function toText(value) {
  return String(value ?? "").trim();
}

function toSafeUrl(value) {
  const raw = toText(value);
  if (!raw) return "";

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
    ? raw
    : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function toSafePhone(value) {
  return toText(value).replace(/[^0-9+#*(),;.\-\s]/g, "");
}

function normalizeAddress(address) {
  if (!address || typeof address !== "object") return null;

  const line1 = toText(address.line1);
  const line2 = toText(address.line2);
  const city = toText(address.city);
  const state = toText(address.state);
  const zip = toText(address.zip);
  const country = toText(address.country);

  return {
    line1,
    line2,
    city,
    state,
    zip,
    country,
  };
}

function composeLocationLabel(locationText, address) {
  const explicit = toText(locationText);
  if (explicit) return explicit;

  if (!address) return "";

  const cityState = [address.city, address.state].filter(Boolean).join(", ");
  const country = address.country || "";

  return [cityState, country].filter(Boolean).join(" • ");
}

export function mapVportBusinessCardPublicRow(raw) {
  if (!raw || typeof raw !== "object") return null;

  const address = normalizeAddress(raw.address);
  const locationLabel = composeLocationLabel(raw.location_text, address);

  return {
    profileId: raw.profile_id ?? null,
    actorId: raw.actor_id ?? null,
    slug: toText(raw.slug).toLowerCase(),
    businessName: toText(raw.business_name) || "VPORT",
    avatarUrl: toSafeUrl(raw.avatar_url),
    logoUrl: toSafeUrl(raw.logo_url),
    description: toText(raw.bio),
    locationLabel,
    address,
    phone: toSafePhone(raw.phone_public),
    websiteUrl: toSafeUrl(raw.website_url),
    email: toText(raw.email_public),
  };
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateVportBusinessCardLeadInput(input = {}) {
  const name = toText(input.name);
  const phone = toSafePhone(input.phone);
  const email = toText(input.email).toLowerCase();
  const message = toText(input.message);

  const fieldErrors = {};

  if (!name) fieldErrors.name = "Name is required.";
  if (!message) fieldErrors.message = "Message is required.";

  if (!phone && !email) {
    fieldErrors.contact = "Add a phone number or email.";
  }

  if (!isValidEmail(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  const ok = Object.keys(fieldErrors).length === 0;

  return {
    ok,
    fieldErrors,
    payload: {
      name,
      phone,
      email,
      message,
    },
  };
}
