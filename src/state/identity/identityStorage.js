// src/state/identity/identityStorage.js

const KEY = 'vc.identity.actorId';

export function saveIdentity(actorId) {
  try {
    localStorage.setItem(KEY, actorId);
  } catch {}
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
  } catch {}
}
