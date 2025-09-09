// Single source of truth for the current actor (profile | vport)

const K_KIND = 'actor_kind';
const K_VPORT_ID = 'actor_vport_id';
const K_TOUCH = 'actor_touch';

export function getActor() {
  const kind = localStorage.getItem(K_KIND);
  if (kind === 'vport') {
    const id = localStorage.getItem(K_VPORT_ID);
    if (id) return { kind: 'vport', id: String(id) };
  }
  return { kind: 'profile' };
}

export function setActor(actor) {
  if (actor?.kind === 'vport' && actor.id) {
    localStorage.setItem(K_KIND, 'vport');
    localStorage.setItem(K_VPORT_ID, String(actor.id));
  } else {
    localStorage.setItem(K_KIND, 'profile');
    localStorage.removeItem(K_VPORT_ID);
  }
  try { window.dispatchEvent(new CustomEvent('actor:changed', { detail: actor })); } catch {}
  try { localStorage.setItem(K_TOUCH, String(Date.now())); } catch {}
}

/** Subscribe to actor changes. Returns an unsubscribe fn. */
export function onActorChange(handler) {
  const emit = (detail) => { try { handler(detail ?? getActor()); } catch {} };
  const onEvt = (e) => emit(e?.detail);
  const onStorage = (e) => {
    if ([K_KIND, K_VPORT_ID, K_TOUCH].includes(e.key)) emit();
  };
  window.addEventListener('actor:changed', onEvt);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('actor:changed', onEvt);
    window.removeEventListener('storage', onStorage);
  };
}
