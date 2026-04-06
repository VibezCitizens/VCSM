// src/features/identity/resolvers/wentrexIdentity.resolver.js
// ============================================================
// Wentrex — App Context Resolver
// ------------------------------------------------------------
// Resolves actor identity, access, roles, and destination for
// the Wentrex app context. Injected into the identity engine
// via configureIdentityEngine({ resolveAppContext }).
//
// This file lives in Wentrex (not in the engine) because it
// queries learning.* schema tables that are Wentrex-specific.
// ============================================================

import { wentrexDestinationFromRoleKeys } from '../wentrexAccess.js'

/**
 * Resolve the learning actor needed for provisioning.
 * Lightweight — only queries actors + access, no role resolution.
 *
 * Used by provisionWentrexIdentity controller during the bootstrap
 * step, before any platform identity records exist for this user.
 *
 * @param {Object} supabase
 * @param {string} userId
 * @returns {Promise<{ actor: { id: string, organization_id: string|null }|null, hasAccess: boolean }>}
 */
export async function resolveWentrexActorForProvisioning(supabase, userId) {
  const { data: actor, error: actorError } = await supabase
    .schema('learning')
    .from('actors')
    .select('id, organization_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (actorError) throw actorError

  if (!actor) return { actor: null, hasAccess: false }

  const { data: access } = await supabase
    .schema('learning')
    .from('actor_access')
    .select('can_access_learning_center, revoked_at')
    .eq('actor_id', actor.id)
    .maybeSingle()

  const hasAccess = access?.can_access_learning_center === true && !access?.revoked_at

  return { actor, hasAccess }
}

/**
 * Create the Wentrex all-in-one app context resolver.
 *
 * Reads the provisioned platform actor link as its entry point — actor_id,
 * organization_id, and platform UUID all come from platform.user_app_actor_links.
 * Role data is derived from learning schema domain tables.
 *
 * @param {Object} supabase - Supabase client
 * @returns {Function} resolveAppContext
 */
export function createWentrexAppContextResolver(supabase) {
  return async function resolveAppContext({ userAppAccountId, userId }) {
    // 1. Read the provisioned platform actor link.
    const { data: link, error: linkError } = await supabase
      .schema('platform')
      .from('user_app_actor_links')
      .select('id, actor_id, meta, status')
      .eq('user_app_account_id', userAppAccountId)
      .eq('actor_source', 'learning')
      .eq('status', 'active')
      .maybeSingle()

    if (linkError) throw linkError

    if (!link) {
      return {
        actorLinks:         [],
        roleKeys:           [],
        capabilityKeys:     [],
        isSuspended:        false,
        defaultDestination: null,
      }
    }

    const actorId        = link.actor_id
    const organizationId = link.meta?.organization_id ?? null
    const linkId         = link.id

    // 2. Check Wentrex access gate (learning.actor_access).
    const { data: access } = await supabase
      .schema('learning')
      .from('actor_access')
      .select('can_access_learning_center, revoked_at')
      .eq('actor_id', actorId)
      .maybeSingle()

    const hasAccess = access?.can_access_learning_center === true && !access?.revoked_at

    if (!hasAccess) {
      return {
        actorLinks:         [_buildActorLinkRow({ id: actorId, organization_id: organizationId }, userAppAccountId, 'inactive', linkId)],
        roleKeys:           [],
        capabilityKeys:     [],
        isSuspended:        true,
        defaultDestination: '/suspended',
      }
    }

    // 3. Derive role keys from Wentrex domain tables in parallel.
    const [membershipsResult, parentResult, studentResult] = await Promise.all([
      supabase
        .schema('learning')
        .from('organization_memberships')
        .select('role')
        .eq('actor_id', actorId)
        .eq('status', 'active'),

      supabase
        .schema('learning')
        .from('parent_student_links')
        .select('id', { count: 'exact', head: true })
        .eq('parent_actor_id', actorId),

      supabase
        .schema('learning')
        .from('course_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('actor_id', actorId)
        .eq('role', 'student')
        .eq('status', 'active'),
    ])

    const orgRoles  = new Set((membershipsResult.data ?? []).map((m) => m.role))
    const isParent  = (parentResult.count ?? 0) > 0
    const isStudent = (studentResult.count ?? 0) > 0

    // 4. Build role key list
    const roleKeys = [...orgRoles]
    if (isParent)  roleKeys.push('parent')
    if (isStudent) roleKeys.push('student')

    // 5. Resolve destination
    const defaultDestination = wentrexDestinationFromRoleKeys(roleKeys)

    return {
      actorLinks:         [_buildActorLinkRow({ id: actorId, organization_id: organizationId }, userAppAccountId, 'active', linkId)],
      roleKeys,
      capabilityKeys:     [],
      isSuspended:        false,
      defaultDestination,
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _buildActorLinkRow(actor, userAppAccountId, status, linkId) {
  return {
    id:                    linkId,
    user_app_account_id:   userAppAccountId,
    app_id:                null,
    actor_source:          'learning',
    actor_id:              actor.id,
    actor_kind:            'learning_actor',
    is_primary:            true,
    is_switchable:         false,
    status,
    display_name_snapshot: null,
    avatar_url_snapshot:   null,
    meta: {
      organization_id: actor.organization_id ?? null,
    },
  }
}
