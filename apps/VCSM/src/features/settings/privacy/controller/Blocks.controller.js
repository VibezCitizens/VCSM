// src/features/settings/privacy/controller/Blocks.controller.js
// ============================================================
// BLOCKS CONTROLLER (ACTOR-BASED)
// ------------------------------------------------------------
// - Orchestrates blocking / unblocking
// - Reads via actor SSOT (actor_presentation)
// - NO direct profile joins
// - NO hydration here
// ============================================================

import {
  dalDeleteBlockByTarget,
  dalInsertBlock,
  dalListMyBlocks,
  dalReadActorKindAndVportId,
  dalSearchActors,
} from '@/features/settings/privacy/dal/blocks.dal'
import {
  modelActorRows,
  modelBlockRows,
} from '@/features/settings/privacy/models/blocks.model'

async function resolveVportIdFromActor(actorId) {
  if (!actorId) return null

  try {
    const row = await dalReadActorKindAndVportId(actorId)
    return row?.vport_id ?? null
  } catch (error) {
    console.error('[Blocks.controller] resolveVportIdFromActor failed', error)
    return null
  }
}

// ============================================================
// LIST MY BLOCKS
// ============================================================
export async function ctrlListMyBlocks({ actorId, scope }) {
  if (!actorId) throw new Error('Missing actorId')
  if (scope !== 'user' && scope !== 'vport') throw new Error('Invalid scope')

  // ✅ actor-first: vport_id resolved internally when needed
  const vportId = scope === 'vport' ? await resolveVportIdFromActor(actorId) : null
  if (scope === 'vport' && !vportId) {
    throw new Error('Missing vportId for vport scope')
  }

  const rows = await dalListMyBlocks({ actorId, scope, vportId })
  return modelBlockRows(rows)
}

// ============================================================
// SEARCH ACTORS (SSOT — REUSED FROM EXPLORE)
// ============================================================
export async function ctrlSearchActors({ query }) {
  const rows = await dalSearchActors({
    query,
    limit: 12,
  })

  return modelActorRows(rows)
}

// ============================================================
// BLOCK ACTOR
// ============================================================
export async function ctrlBlockActor({
  actorId,
  blockedActorId,
  scope,
  existingBlockedIds,
}) {
  if (!actorId) throw new Error('Missing actorId')
  if (!blockedActorId) throw new Error('Missing blockedActorId')
  if (actorId === blockedActorId) throw new Error('You cannot block yourself.')
  if (scope !== 'user' && scope !== 'vport') throw new Error('Invalid scope')

  // ✅ actor-first
  const vportId = scope === 'vport' ? await resolveVportIdFromActor(actorId) : null
  if (scope === 'vport' && !vportId) {
    throw new Error('Missing vportId for vport scope')
  }

  // idempotent
  if (existingBlockedIds && existingBlockedIds.has(blockedActorId)) {
    return { ok: true, changed: false }
  }

  await dalInsertBlock({ actorId, blockedActorId, scope, vportId })
  return { ok: true, changed: true }
}

// ============================================================
// UNBLOCK ACTOR
// ============================================================
export async function ctrlUnblockActor({
  actorId,
  blockedActorId,
  scope,
  existingBlockedIds,
}) {
  if (!actorId) throw new Error('Missing actorId')
  if (!blockedActorId) throw new Error('Missing blockedActorId')
  if (scope !== 'user' && scope !== 'vport') throw new Error('Invalid scope')

  // ✅ actor-first
  const vportId = scope === 'vport' ? await resolveVportIdFromActor(actorId) : null
  if (scope === 'vport' && !vportId) {
    throw new Error('Missing vportId for vport scope')
  }

  // idempotent
  if (existingBlockedIds && !existingBlockedIds.has(blockedActorId)) {
    return { ok: true, changed: false }
  }

  await dalDeleteBlockByTarget({ actorId, blockedActorId, scope, vportId })
  return { ok: true, changed: true }
}
