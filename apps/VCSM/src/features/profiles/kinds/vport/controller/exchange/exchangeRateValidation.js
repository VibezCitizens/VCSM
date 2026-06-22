const MAX_EXCHANGE_RATE = 1_000_000;

export function assertValidRate(name, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      `${name} must be a positive finite number — received ${JSON.stringify(value)}`
    );
  }
  if (n > MAX_EXCHANGE_RATE) {
    throw new Error(
      `${name} exceeds maximum allowed rate of ${MAX_EXCHANGE_RATE} — received ${n}`
    );
  }
  return n;
}
