const learningViewCache = new Map();

export function createLearningViewCacheKey(scope, parts = []) {
  return JSON.stringify([scope, ...parts]);
}

export function readLearningViewCache(key) {
  if (!key) {
    return null;
  }

  return learningViewCache.get(key) ?? null;
}

export function writeLearningViewCache(key, data) {
  if (!key) {
    return;
  }

  learningViewCache.set(key, {
    data,
    updatedAt: Date.now(),
  });
}

export function clearLearningViewCache(key) {
  if (!key) {
    return;
  }

  learningViewCache.delete(key);
}

export default learningViewCache;
