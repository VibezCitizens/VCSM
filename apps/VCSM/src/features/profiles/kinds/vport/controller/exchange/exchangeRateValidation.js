export function assertValidRate(name, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      `${name} must be a positive finite number — received ${JSON.stringify(value)}`
    );
  }
  return n;
}
