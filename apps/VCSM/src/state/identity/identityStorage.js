// src/state/identity/identityStorage.js

const KEY_PREFIX = 'vc.identity.actorId';

function scopedKey(userId) {
  if (!userId) return KEY_PREFIX;
  return `${KEY_PREFIX}.${userId}`;
}

export function saveIdentity(actorId, userId) {
  try {
    localStorage.setItem(scopedKey(userId), actorId);
  } catch (_ERR) {
    void _ERR;
  }
}

export function loadIdentity(userId) {
  try {
    return localStorage.getItem(scopedKey(userId));
  } catch {
    return null;
  }
}

export function clearIdentity(userId) {
  try {
    localStorage.removeItem(scopedKey(userId));
  } catch (_ERR) {
    void _ERR;
  }
}

/**
 * Clear ALL identity storage keys for every userId.
 * Called on logout to ensure no prior actor cache survives.
 */
export function clearAllIdentityStorage() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (_ERR) {
    void _ERR;
  }
}
