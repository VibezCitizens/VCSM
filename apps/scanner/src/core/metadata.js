export function wrapMap({ config, startedAt, confidence = "HIGH", data, counts = {} }) {
  const generatedAt = new Date().toISOString();
  const scanDurationMs = Date.now() - startedAt;

  return {
    version: 1,
    scannerVersion: config.scannerVersion,
    generatedAt,
    root: config.repoRoot,
    scanDurationMs,
    confidence,
    ...counts,
    data
  };
}

export function countField(name, value) {
  return { [name]: Array.isArray(value) ? value.length : 0 };
}
