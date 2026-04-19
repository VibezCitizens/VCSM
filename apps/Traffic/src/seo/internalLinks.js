export function dedupeInternalLinks(links) {
  const seen = new Set();
  const output = [];

  for (const link of links) {
    if (seen.has(link.href)) {
      continue;
    }
    seen.add(link.href);
    output.push(link);
  }

  return output;
}
