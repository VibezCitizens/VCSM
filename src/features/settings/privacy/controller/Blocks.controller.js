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
} from '@/features/settings/privacy/dal/blocks.dal'

import { searchActors } from '@/features/actors/controllers/searchActors.controller'
import {
  modelActorRows,
  modelBlockRows,
} from '@/features/settings/privacy/models/blocks.model'

// ============================================================
// LIST MY BLOCKS
// ============================================================
export async function ctrlListMyBlocks({ actorId, scope, vportId }) {
  if (!actorId) throw new Error('Missing actorId')
  if (scope !== 'user' && scope !== 'vport') {
    throw new Error('Invalid scope')
  }
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
  const rows = await searchActors({
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
  vportId,
  existingBlockedIds,
}) {
  if (!actorId) throw new Error('Missing actorId')
  if (!blockedActorId) throw new Error('Missing blockedActorId')
  if (actorId === blockedActorId) {
    throw new Error('You cannot block yourself.')
  }
  if (scope !== 'user' && scope !== 'vport') {
    throw new Error('Invalid scope')
  }
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
  vportId,
  existingBlockedIds,
}) {
  if (!actorId) throw new Error('Missing actorId')
  if (!blockedActorId) throw new Error('Missing blockedActorId')
  if (scope !== 'user' && scope !== 'vport') {
    throw new Error('Invalid scope')
  }
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
