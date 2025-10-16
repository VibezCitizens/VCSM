// C:\Users\vibez\OneDrive\Desktop\no src\src\lib\actors\actor.js
// src/lib/actors/actor.js
// Single source of truth for the current “actor” the user is operating as
// (their own profile, or a selected vport). Pure client-side state.
// No network / DB writes happen here.

const K_KIND = 'actor_kind';
const K_VPORT_ID = 'actor_vport_id';
const K_TOUCH = 'actor_touch'; // used to trigger storage events reliably across tabs
export const ACTOR_EVENT = 'actor:changed';

// If older code stored the active actor under this legacy key, migrate it once.
const LEGACY_KEY = 'vibez.activeActor.v1';

/* ---------------------- One-time migration from legacy key ---------------------- */
(function migrateLegacyActorKey() {
  try {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    // expected legacy shape: { kind: 'profile' | 'vport', id?: '<uuid>' }
    if (saved && (saved.kind === 'profile' || saved.kind === 'vport')) {
      if (saved.kind === 'vport' && saved.id) {
        window.localStorage.setItem(K_KIND, 'vport');
        window.localStorage.setItem(K_VPORT_ID, String(saved.id));
      } else {
        window.localStorage.setItem(K_KIND, 'profile');
        window.localStorage.removeItem(K_VPORT_ID);
      }
      // remove legacy key to avoid re-running
      window.localStorage.removeItem(LEGACY_KEY);
      // notify listeners just in case something is mounted already
      try {
        window.dispatchEvent(new CustomEvent(ACTOR_EVENT, { detail: saved }));
      } catch {}
      // touch to ping other tabs
      window.localStorage.setItem(K_TOUCH, String(Date.now()));
    }
  } catch {
    // ignore migration errors
  }
})();

/* ------------------------------- Safe storage ------------------------------ */
function lsGet(key) {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key, val) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, val);
  } catch {}
}
function lsRemove(key) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch {}
}

/* --------------------------------- Types ---------------------------------- */
/**
 * @typedef {{ kind: 'profile' } | { kind: 'vport', id: string }} Actor
 */

/* --------------------------------- Getters -------------------------------- */
/** Get the current actor (defaults to { kind: 'profile' } if nothing set). */
export function getActor() {
  const kind = lsGet(K_KIND);
  if (kind === 'vport') {
    const id = lsGet(K_VPORT_ID);
    if (id) return { kind: 'vport', id: String(id) };
  }
  return { kind: 'profile' };
}

/** Convenience: returns the selected vport id or null if not in vport mode. */
export function getActiveVportId() {
  const a = getActor();
  return a.kind === 'vport' ? a.id : null;
}

/** True when user is acting as a vport. */
export function isVportMode(actor = getActor()) {
  return actor.kind === 'vport';
}

/** True when user is acting as their own profile. */
export function isProfileMode(actor = getActor()) {
  return actor.kind === 'profile';
}

/* --------------------------------- Setters -------------------------------- */
/**
 * Set the current actor.
 * @param {Actor} actor
 * @returns {Actor} the actor that was saved
 */
export function setActor(actor) {
  if (actor?.kind === 'vport' && actor.id) {
    lsSet(K_KIND, 'vport');
    lsSet(K_VPORT_ID, String(actor.id));
  } else {
    // fallback to profile mode
    lsSet(K_KIND, 'profile');
    lsRemove(K_VPORT_ID);
  }
  // broadcast change to this tab
  try {
    window.dispatchEvent(new CustomEvent(ACTOR_EVENT, { detail: actor }));
  } catch {}
  // nudge other tabs/listeners
  lsSet(K_TOUCH, String(Date.now()));
  return getActor();
}

/** Switch to profile mode. */
export function setProfileMode() {
  return setActor({ kind: 'profile' });
}

/** Switch to vport mode. Throws if no id given. */
export function setVportMode(vportId) {
  if (!vportId) throw new Error('setVportMode: vportId is required');
  return setActor({ kind: 'vport', id: String(vportId) });
}

/** Clear actor selection (equivalent to profile mode). */
export function clearActor() {
  lsSet(K_KIND, 'profile');
  lsRemove(K_VPORT_ID);
  try {
    window.dispatchEvent(new CustomEvent(ACTOR_EVENT, { detail: { kind: 'profile' } }));
  } catch {}
  lsSet(K_TOUCH, String(Date.now()));
  return getActor();
}

/* ------------------------------ Subscriptions ----------------------------- */
/**
 * Subscribe to actor changes (same-tab events and cross-tab storage).
 * Returns an unsubscribe function.
 * @param {(actor: Actor) => void} handler
 */
export function onActorChange(handler) {
  const emit = (detail) => {
    try {
      handler(detail ?? getActor());
    } catch {}
  };

  const onEvt = (e) => emit(e?.detail);
  const onStorage = (e) => {
    if (!e?.key) return;
    if (e.key === K_KIND || e.key === K_VPORT_ID || e.key === K_TOUCH) emit();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(ACTOR_EVENT, onEvt);
    window.addEventListener('storage', onStorage);
  }

  // fire immediately with current state so UIs can render
  emit();

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(ACTOR_EVENT, onEvt);
      window.removeEventListener('storage', onStorage);
    }
  };
}
