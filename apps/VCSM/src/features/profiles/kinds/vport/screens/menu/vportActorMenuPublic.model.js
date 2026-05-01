export function toSafeExternalUrl(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  const candidate = /^[a-z][a-z0-9+\-.]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function toSafePhone(raw) {
  return String(raw ?? "")
    .replace(/[^0-9+#*(),;.\-\s]/g, "")
    .trim();
}
