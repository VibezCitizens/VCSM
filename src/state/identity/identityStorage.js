// src/state/identity/identityStorage.js

const KEY = 'vc.identity.actorId';

export function saveIdentity(actorId) {
  try {
    localStorage.setItem(KEY, actorId);
  } catch (_ERR) {
    void _ERR;
  }
}

export function loadIdentity() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearIdentity() {
  try {
    localStorage.removeItem(KEY);
  } catch (_ERR) {
    void _ERR;
  }
}
