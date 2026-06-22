const IS_DEV = import.meta.env.DEV;

export const _identityInflight = new Map();
export const _identityResolveCounts = new Map();

export function logIdentityResolveCount(userId, resolveAttempt) {
  if (!IS_DEV) return;

  const key = userId ?? 'anonymous';
  const count = (_identityResolveCounts.get(key) ?? 0) + 1;
  _identityResolveCounts.set(key, count);

  console.log('[Identity] resolve count', {
    userId: userId?.slice?.(0, 8) ?? null,
    resolveAttempt,
    count,
  });
}
