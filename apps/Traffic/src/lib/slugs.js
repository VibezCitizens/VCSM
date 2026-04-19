function toSafeString(input) {
  if (input == null) {
    return "";
  }
  return String(input);
}

export function normalizeSlug(input) {
  return toSafeString(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugEquals(left, right) {
  return normalizeSlug(left) === normalizeSlug(right);
}

export function toSlug(input) {
  return normalizeSlug(input);
}
