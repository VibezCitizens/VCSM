// src/state/actorFields.js
//
// One helper for BOTH styles:
//
// 1) "classic" tables:  user_id / vport_id
// 2) "flags" tables:    user_id / as_vport / actor_vport_id
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
// includeNulls=true ensures NULLs are written for CHECK/RLS expectations.

/**
 * @typedef {Object} Identity
 * @property {'user'|'vport'} type
 * @property {string|null} userId
 * @property {string|null} [ownerId]
 * @property {string|null} [vportId]
 */

/**
 * Stamp actor-related fields on an insert/update payload.
 * @param {Identity|null} identity
 * @param {Record<string, any>} [base]
 * @param {Object} [config]
 * @param {'classic'|'flags'|'auto'} [config.mode='auto']
 * @param {string} [config.userKey='user_id']
 * @param {string} [config.vportKey='vport_id']
 * @param {string} [config.asVportKey='as_vport']
 * @param {string} [config.actorVportKey='actor_vport_id']
 * @param {boolean} [config.includeNulls=true]
 * @returns {Record<string, any>}
 */
export function stampActor(identity, base = {}, config = {}) {
  const {
    mode = 'auto',
    userKey = 'user_id',
    vportKey = 'vport_id',            // classic
    asVportKey = 'as_vport',          // flags
    actorVportKey = 'actor_vport_id', // flags
    includeNulls = true,
  } = config;

  if (!identity) return { ...base };

  const wantsFlags =
    mode === 'flags' ||
    (mode === 'auto' && (base?.[asVportKey] !== undefined || base?.[actorVportKey] !== undefined));

  if (wantsFlags) {
    return stampFlags(identity, base, { userKey, asVportKey, actorVportKey, includeNulls });
  }
  return stampClassic(identity, base, { userKey, vportKey, includeNulls });
}

/**
 * Classic mode: sets user_id and (optionally) vport_id.
 * @private
 */
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

/**
 * Flags mode: sets user_id, as_vport, actor_vport_id.
 * @private
 */
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

/**
 * Back-compat classic wrapper.
 */
export function applyActorFields(identity, base = {}, keyMap = {}) {
  return stampActor(identity, base, { mode: 'classic', ...keyMap });
}

/**
 * Flags wrapper (for tables like post_reactions).
 */
export function applyActorFlags(identity, base = {}, keyMap = {}) {
  return stampActor(identity, base, { mode: 'flags', ...keyMap });
}
