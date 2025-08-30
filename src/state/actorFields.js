// src/state/actorFields.js
// Stamp actor columns on payloads based on current identity.
// Defaults assume a table with { user_id, vport_id } columns.
// Pass a custom map when a table uses different names (e.g. messages.sender_id).
export function applyActorFields(identity, base = {}, map = {}) {
  const userKey = map.userKey ?? "user_id";
  const vportKey = map.vportKey ?? "vport_id"; // set to null if the table doesn't have a vport column

  if (!identity) return { ...base };

  if (identity.type === "user") {
    const stamped = { ...base, [userKey]: identity.userId };
    if (vportKey) stamped[vportKey] = null;
    return stamped;
  }

  if (identity.type === "vport") {
    const stamped = {
      ...base,
      [userKey]: identity.userId || identity.ownerId || null,
    };
    if (vportKey) stamped[vportKey] = identity.vportId;
    return stamped;
  }

  return { ...base };
}
