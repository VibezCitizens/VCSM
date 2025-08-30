export function parseTags(input = '') {
  return input
    .replace(/,/g, ' ')
    .split(' ')
    .map((t) => (t.startsWith('#') ? t.slice(1) : t))
    .map((t) => t.trim())
    .filter(Boolean);
}
