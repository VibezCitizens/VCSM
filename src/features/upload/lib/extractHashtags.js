export function extractHashtags(text = "") {
  const matches = text.match(/#([a-zA-Z0-9_-]{1,64})/g) || [];
  return [...new Set(matches.map(m => m.toLowerCase().slice(1)))];
}
