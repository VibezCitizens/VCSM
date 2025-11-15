// src/lib/actors/actor.js
// =============================================================================
//  Vibez Citizens — Actor State Manager
//  ---------------------------------------------------------------------------
//  Single source of truth for the current “actor” the user is operating as.
//
//  🧭 Responsibilities:
//    • Keeps track of whether the user is acting as themselves (citizen)
//      or as a business (vport).
//    • Stores the current actor’s Supabase `vc.actors.id` persistently.
//    • Keeps cross-tab state in sync via localStorage and `CustomEvent`.
//    • Provides subscription utilities for React hooks.
//
//  🧩 Example usage:
//      const actor = getActor();
//      setProfileMode({ actorId: "abc123" });
//      setVportMode("shop-99", { actorId: "def456" });
//      onActorChange((a) => console.log("actor switched", a));
//
//  ✅ Updated: November 15, 2025
//  ✅ Latest Additions:
//     1. Expanded docstrings and examples for clarity.
//     2. Strengthened null checks and fallback guards.
//     3. Improved event broadcast reliability.
//     4. Cleaned up migration logic comments.
// =============================================================================

// -----------------------------------------------------------------------------
// 🗝️ Storage Keys
// -----------------------------------------------------------------------------
const K_KIND = 'actor_kind';             // "profile" | "vport"
const K_VPORT_ID = 'actor_vport_id';     // active vport ID (if any)
const K_ACTOR_ID = 'actor_id';           // persistent vc.actors.id
const K_TOUCH = 'actor_touch';           // triggers cross-tab change detection
export const ACTOR_EVENT = 'actor:changed';

// Legacy migration key for pre-v8 actor storage format
const LEGACY_KEY = 'vibez.activeActor.v1';

// -----------------------------------------------------------------------------
// 🚚 One-Time Migration (Legacy → New Keys)
// -----------------------------------------------------------------------------
(function migrateLegacyActorKey() {
  try {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (saved && (saved.kind === 'profile' || saved.kind === 'vport')) {
      if (saved.kind === 'vport' && saved.id) {
        window.localStorage.setItem(K_KIND, 'vport');
        window.localStorage.setItem(K_VPORT_ID, String(saved.id));
      } else {
        window.localStorage.setItem(K_KIND, 'profile');
        window.localStorage.removeItem(K_VPORT_ID);
      }

      window.localStorage.removeItem(LEGACY_KEY);

      try {
        window.dispatchEvent(new CustomEvent(ACTOR_EVENT, { detail: saved }));
      } catch {}

      // ping other tabs
      window.localStorage.setItem(K_TOUCH, String(Date.now()));
    }
  } catch {
    // fail silently — migration is non-critical
  }
})();

// -----------------------------------------------------------------------------
// 🧱 Safe localStorage Wrappers
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 📘 Type Reference
// -----------------------------------------------------------------------------
/**
 * @typedef {{ kind: 'profile', actorId?: string } |
 *           { kind: 'vport', id: string, actorId?: string }} Actor
 */

// -----------------------------------------------------------------------------
// 🪪 Getters
// -----------------------------------------------------------------------------

/**
 * Returns the current actor object from localStorage.
 * Falls back to `{ kind: 'profile' }` if not set.
 */
export function getActor() {
  const kind = lsGet(K_KIND);
  const actorId = lsGet(K_ACTOR_ID) || undefined;

  if (kind === 'vport') {
    const id = lsGet(K_VPORT_ID);
    if (id) return { kind: 'vport', id: String(id), actorId };
  }

  return { kind: 'profile', actorId };
}

/** Returns the active vport id, or `null` if not in vport mode. */
export function getActiveVportId() {
  const a = getActor();
  return a.kind === 'vport' ? a.id : null;
}

/** Returns the stored `actor_id` (vc.actors.id) or `null`. */
export function getCurrentActorIdLocal() {
  return getActor().actorId ?? null;
}

/** Returns true if the actor is currently a vport. */
export function isVportMode(actor = getActor()) {
  return actor.kind === 'vport';
}

/** Returns true if the actor is currently the user’s profile. */
export function isProfileMode(actor = getActor()) {
  return actor.kind === 'profile';
}

// -----------------------------------------------------------------------------
// ✏️ Setters
// -----------------------------------------------------------------------------
/**
 * Set the current actor in localStorage and broadcast changes.
 * Automatically updates all actor keys and notifies listeners.
 * @param {Actor} actor
 * @returns {Actor} the saved actor
 */
export function setActor(actor) {
  // 1️⃣ Store kind + vport_id
  if (actor?.kind === 'vport' && actor.id) {
    lsSet(K_KIND, 'vport');
    lsSet(K_VPORT_ID, String(actor.id));
  } else {
    lsSet(K_KIND, 'profile');
    lsRemove(K_VPORT_ID);
  }

  // 2️⃣ Store actor_id (or clear)
  if (actor?.actorId) {
    lsSet(K_ACTOR_ID, String(actor.actorId));
  } else {
    lsRemove(K_ACTOR_ID);
  }

  // 3️⃣ Notify subscribers
  try {
    window.dispatchEvent(new CustomEvent(ACTOR_EVENT, { detail: getActor() }));
  } catch {}
  lsSet(K_TOUCH, String(Date.now()));

  return getActor();
}

/**
 * Update only the actor_id while keeping the same mode (profile/vport).
 * Useful after async Supabase resolution.
 */
export function setCurrentActorIdLocal(actorId) {
  if (actorId) {
    lsSet(K_ACTOR_ID, String(actorId));
  } else {
    lsRemove(K_ACTOR_ID);
  }

  try {
    window.dispatchEvent(new CustomEvent(ACTOR_EVENT, { detail: getActor() }));
  } catch {}
  lsSet(K_TOUCH, String(Date.now()));
  return getActor();
}

/** Switch to profile mode. Optionally accepts `{ actorId }`. */
export function setProfileMode(options = {}) {
  const { actorId } = options || {};
  return setActor({ kind: 'profile', actorId });
}

/** Switch to vport mode with the given vport ID. Optionally pass `{ actorId }`. */
export function setVportMode(vportId, options = {}) {
  if (!vportId) throw new Error('setVportMode: vportId is required');
  const { actorId } = options || {};
  return setActor({ kind: 'vport', id: String(vportId), actorId });
}

/** Clears all actor-related storage, reverting to profile mode. */
export function clearActor() {
  lsSet(K_KIND, 'profile');
  lsRemove(K_VPORT_ID);
  lsRemove(K_ACTOR_ID);

  try {
    window.dispatchEvent(new CustomEvent(ACTOR_EVENT, { detail: { kind: 'profile' } }));
  } catch {}

  lsSet(K_TOUCH, String(Date.now()));
  return getActor();
}

// -----------------------------------------------------------------------------
// 🔔 Subscriptions
// -----------------------------------------------------------------------------
/**
 * Subscribes to actor changes (both within this tab and across tabs).
 * Returns a cleanup function for unsubscription.
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
    if ([K_KIND, K_VPORT_ID, K_ACTOR_ID, K_TOUCH].includes(e.key)) {
      emit();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(ACTOR_EVENT, onEvt);
    window.addEventListener('storage', onStorage);
  }

  // Initial fire for immediate state
  emit();

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(ACTOR_EVENT, onEvt);
      window.removeEventListener('storage', onStorage);
    }
  };
}

// -----------------------------------------------------------------------------
// 🧩 Internal Debug/Testing Helpers
// -----------------------------------------------------------------------------
export const __actorKeys__ = {
  K_KIND,
  K_VPORT_ID,
  K_ACTOR_ID,
  K_TOUCH,
  LEGACY_KEY,
  ACTOR_EVENT,
};
