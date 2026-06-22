const WRITE_METHODS = ["insert", "update", "delete", "upsert", "rpc"];

export function parseWriteSurfaces(source) {
  const surfaces = [];
  const tableMatches = [...source.matchAll(/\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g)];
  const schemaMatches = [...source.matchAll(/\.schema\(\s*["'`]([^"'`]+)["'`]\s*\)/g)];

  for (const method of WRITE_METHODS) {
    const methodPattern = new RegExp(`\\.${method}\\s*\\(`, "g");
    for (const match of source.matchAll(methodPattern)) {
      const table = nearestTableBefore(tableMatches, match.index);
      if (method !== "rpc" && !table) continue;
      surfaces.push({
        operation: method,
        schema: nearestSchemaBefore(schemaMatches, match.index),
        table: method === "rpc" ? null : table,
        rpc: method === "rpc" ? readFirstStringArg(source, match.index) : null,
        index: match.index
      });
    }
  }

  for (const match of source.matchAll(/\.functions\.invoke\(\s*["'`]([^"'`]+)["'`]/g)) {
    surfaces.push({
      operation: "edge_function",
      schema: null,
      table: null,
      rpc: null,
      functionName: match[1],
      index: match.index
    });
  }

  return surfaces.sort((a, b) => a.index - b.index).map(({ index, ...surface }) => surface);
}

function nearestTableBefore(matches, index) {
  return matches.filter((match) => match.index < index).at(-1)?.[1] ?? null;
}

function nearestSchemaBefore(matches, index) {
  return matches.filter((match) => match.index < index).at(-1)?.[1] ?? null;
}

function readFirstStringArg(source, index) {
  const fragment = source.slice(index, index + 160);
  return fragment.match(/\(\s*["'`]([^"'`]+)["'`]/)?.[1] ?? null;
}
