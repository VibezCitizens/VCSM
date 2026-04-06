const ADDRESS_PARTS = ["line1", "line2", "city", "state", "zip", "country"];

function toAddressObject(rawAddress) {
  if (rawAddress && typeof rawAddress === "object" && !Array.isArray(rawAddress)) {
    return rawAddress;
  }

  const text = String(rawAddress ?? "").trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function buildDestination(rawAddress) {
  const address = toAddressObject(rawAddress);
  if (!address) return "";

  return ADDRESS_PARTS.map((key) => String(address[key] ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

export function hasDirectionsAddress(vport) {
  return buildDestination(vport?.address).length > 0;
}

export function openDirections(vport) {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    const destination = buildDestination(vport?.address);
    if (!destination) return;

    const encoded = encodeURIComponent(destination);
    const ua = navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    const url = isIOS
      ? `https://maps.apple.com/?daddr=${encoded}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;

    if (isIOS || isAndroid) {
      window.location.href = url;
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    return;
  }
}

export default openDirections;
