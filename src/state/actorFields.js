// src/state/actorFields.js
//
// One helper for BOTH styles:
//
// 1) "classic" tables:   user_id / vport_id
// 2) "flags"   tables:   user_id / as_vport / actor_vport_id
//
// Usage:
//   stampActor(identity, base, { mode: 'classic' | 'flags' | 'auto', ...keyMap })
//
// KeyMap (optional):
//   userKey        (default 'user_id')
//   vportKey       (default 'vport_id')               // classic
//   asVportKey     (default 'as_vport')               // flags
//   actorVportKey  (default 'actor_vport_id')         // flags
//
// QoL wrappers:
//   applyActorFields(identity, base, keyMap)  -> classic
//   applyActorFlags(identity, base, keyMap)   -> flags
//
// includeNulls=true makes sure NULLs are written when needed for CHECK constraints.
export function stampActor(identity, base = {}, config = {}) {
  const {
    mode = 'auto', // 'classic' | 'flags' | 'auto'
    userKey = 'user_id',
    vportKey = 'vport_id',                 // classic
    asVportKey = 'as_vport',               // flags
    actorVportKey = 'actor_vport_id',      // flags
    includeNulls = true,
  } = config;

  if (!identity) return { ...base };

  const wantsFlags =
    mode === 'flags' ||
    (mode === 'auto' && (asVportKey in base || actorVportKey in base));

  if (wantsFlags) {
    return stampFlags(identity, base, { userKey, asVportKey, actorVportKey, includeNulls });
  }
  return stampClassic(identity, base, { userKey, vportKey, includeNulls });
}

function stampClassic(identity, base, { userKey, vportKey, includeNulls }) {
  const out = { ...base };
  out[userKey] = identity.userId ?? identity.ownerId ?? null;

  if (vportKey) {
    if (identity.type === 'vport') {
      out[vportKey] = identity.vportId ?? null;
    } else if (includeNulls) {
      out[vportKey] = null;
    }
  }
  return out;
}

function stampFlags(identity, base, { userKey, asVportKey, actorVportKey, includeNulls }) {
  const out = { ...base };
  out[userKey] = identity.userId ?? identity.ownerId ?? null;

  if (identity.type === 'vport') {
    out[asVportKey] = true;
    out[actorVportKey] = identity.vportId ?? null; // must NOT be null when as_vport=true
  } else {
    out[asVportKey] = false;
    if (includeNulls) out[actorVportKey] = null;
  }
  return out;
}

// Back-compat classic wrapper
export function applyActorFields(identity, base = {}, keyMap = {}) {
  return stampActor(identity, base, { mode: 'classic', ...keyMap });
}

// Flags wrapper (for tables like post_reactions)
export function applyActorFlags(identity, base = {}, keyMap = {}) {
  return stampActor(identity, base, { mode: 'flags', ...keyMap });
}
