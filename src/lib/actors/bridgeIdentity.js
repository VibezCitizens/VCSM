// src/lib/actors/bridgeIdentity.js
// Keep IdentityContext's STORAGE_KEY in sync with the actor store.
// Run this BEFORE IdentityProvider renders.

const STORAGE_KEY = 'vibez.activeActor.v1';
const K_KIND = 'actor_kind';
const K_VPORT_ID = 'actor_vport_id';
const K_ACTOR_ID = 'actor_id'; // NEW: carried for consumers that care (Identity listens via onActorChange)

function readActorKeys() {
  try {
    const kind = localStorage.getItem(K_KIND);
    const vid = localStorage.getItem(K_VPORT_ID);
    const aid = localStorage.getItem(K_ACTOR_ID); // may be null
    return { kind, vid, aid };
  } catch {
    return { kind: null, vid: null, aid: null };
  }
}

function writeStorageKeyFromActor({ kind, vid /*, aid*/ }) {
  try {
    if (kind === 'vport' && vid) {
      localStorage.setItem(STORAGE_KEY, `vport:${vid}`);
    } else if (kind === 'profile' || !kind) {
      // IdentityContext expects a citizen id string like 'citizen:<uid>' but we
      // don't know the uid here. Leaving STORAGE_KEY untouched is fine; Identity
      // will fall back to citizen. We mainly care about preserving VPORT mode.
      // If you want to force citizen explicitly, you could remove the key:
      // localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

// One-time sync on boot
(function syncOnce() {
  const { kind, vid } = readActorKeys();
  writeStorageKeyFromActor({ kind, vid });
})();

// Listen for cross-tab changes of actor keys and keep STORAGE_KEY updated.
(function subscribeStorage() {
  if (typeof window === 'undefined') return;
  window.addEventListener('storage', (e) => {
    if (!e?.key) return;
    if (e.key === K_KIND || e.key === K_VPORT_ID || e.key === K_ACTOR_ID) {
      const { kind, vid } = readActorKeys();
      writeStorageKeyFromActor({ kind, vid });
    }
  });
})();

export const __actorKeys__ = { STORAGE_KEY, K_KIND, K_VPORT_ID, K_ACTOR_ID };
