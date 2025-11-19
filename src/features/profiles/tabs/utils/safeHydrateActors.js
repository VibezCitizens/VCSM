// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\tabs\utils\safeHydrateActors.js

/**
 * safeHydrateActors
 *
 * rawActors = array of rows from vc.actors JOINed with profiles/vports
 * blockedRelations = rows from vc.user_blocks
 *
 * We only need:
 *  - vc.actors.id
 *  - vc.actors.kind ('user' | 'vport')
 *  - profile/vport display fields mapped consistently
 *
 * BLOCKING LOGIC:
 * vc.user_blocks contains:
 *   blocker_actor_id  → actor who blocks
 *   blocked_actor_id  → actor being blocked
 *
 * If either matches the hydrated actor’s ID, we hide that actor.
 */
export function safeHydrateActors(rawActors, blockedRelations) {
  if (!Array.isArray(rawActors)) return [];

  // Build Set of blocked actor IDs
  const blockedSet = new Set();

  if (Array.isArray(blockedRelations)) {
    for (const rel of blockedRelations) {
      if (!rel) continue;

      /**
       * SCHEMA-CORRECT MAPPING (matches vc.user_blocks):
       * 
       * blocker_actor_id uuid NOT NULL,
       * blocked_actor_id uuid NOT NULL,
       */
      if (rel.blocker_actor_id) blockedSet.add(rel.blocker_actor_id);
      if (rel.blocked_actor_id) blockedSet.add(rel.blocked_actor_id);
    }
  }

  return rawActors
    .filter(actor => {
      if (!actor || !actor.id) return false;

      // Remove any actor involved in a block relation
      return !blockedSet.has(actor.id);
    })
    .map(actor => ({
      id: actor.id,
      kind: actor.kind ?? null,

      /**
       * Your actors table does not contain display fields.
       * So we normalize based on selected profile/vport join output.
       *
       * Profiles typically return:
       *   display_name, avatar_url, username
       *
       * Vports return:
       *   name → display_name
       *   avatar_url
       *   slug → username
       *
       * NOTE: This NEVER mutates your actor schema.
       */
      display_name:
        actor.display_name ??
        actor.name ??                     // for vports
        'Unknown',

      avatar_url:
        actor.avatar_url ??
        null,

      username:
        actor.username ??
        actor.slug ??                    // for vports
        null,
    }));
}
