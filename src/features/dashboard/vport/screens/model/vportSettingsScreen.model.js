export async function saveVportPublicDetailsByActorId(actorId, payload) {
  const res = await fetch(`/api/vport/${actorId}/public-details`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    let msg = "Failed to save VPORT details.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
      if (data?.message) msg = data.message;
    } catch {
      // Ignore error body parse failures and keep default message.
    }
    throw new Error(msg);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function mapPublicDetailsToDraft(details) {
  const src = details || {};
  return {
    locationText: src.location_text ?? src.locationText ?? "",
    websiteUrl: src.website_url ?? src.websiteUrl ?? "",
    bookingUrl: src.booking_url ?? src.bookingUrl ?? "",
    emailPublic: src.email_public ?? src.emailPublic ?? "",
    phonePublic: src.phone_public ?? src.phonePublic ?? "",
    address: src.address ?? {},
    hours: src.hours ?? {},
    highlights: Array.isArray(src.highlights) ? src.highlights : [],
    languages: Array.isArray(src.languages) ? src.languages : [],
    paymentMethods: Array.isArray(src.payment_methods)
      ? src.payment_methods
      : Array.isArray(src.paymentMethods)
      ? src.paymentMethods
      : [],
  };
}

