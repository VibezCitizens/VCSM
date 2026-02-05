// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\controllers\wandersInboxes.controller.js
// ============================================================================
// WANDERS CONTROLLER — INBOXES
// ============================================================================

import {
  createWandersInbox,
  getWandersInboxById,
  getWandersInboxByPublicId,
  listWandersInboxesByOwnerAnonId,
  updateWandersInbox,
} from '@/features/wanders/dal/wandersInboxes.dal'
import { ensureWandersAnonIdentity } from '@/features/wanders/controllers/ensureWandersAnoncontroller'
import { toWandersInbox } from '@/features/wanders/models/wandersInbox.model'

function makePublicId(prefix = 'w_inbox') {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`
  return `${prefix}_${id}`
}

/**
 * Create an anon-owned inbox (anon-first).
 * @param {{ realmId: string, publicId?: string, acceptsAnon?: boolean, defaultFolder?: 'inbox'|'requests', isActive?: boolean }} input
 */
export async function createAnonWandersInbox(input) {
  const anon = await ensureWandersAnonIdentity({ touch: true })

  const row = await createWandersInbox({
    publicId: input.publicId ?? makePublicId(),
    realmId: input.realmId,
    ownerAnonId: anon.id,
    ownerActorId: null,
    isActive: input.isActive ?? true,
    acceptsAnon: input.acceptsAnon ?? true,
    defaultFolder: input.defaultFolder ?? 'inbox',
  })

  return toWandersInbox(row)
}

/**
 * Read inbox by id (raw read, domain return).
 * @param {{ inboxId: string }} input
 */
export async function readWandersInboxById(input) {
  const row = await getWandersInboxById(input.inboxId)
  return toWandersInbox(row)
}

/**
 * Public lookup by publicId.
 * @param {{ publicId: string }} input
 */
export async function readWandersInboxByPublicId(input) {
  const row = await getWandersInboxByPublicId(input.publicId)
  return toWandersInbox(row)
}

/**
 * List inboxes for current anon owner.
 * @param {{ isActive?: boolean|null, limit?: number }} input
 */
export async function listMyWandersInboxesAsAnon(input = {}) {
  const anon = await ensureWandersAnonIdentity({ touch: true })

  const rows = await listWandersInboxesByOwnerAnonId({
    ownerAnonId: anon.id,
    isActive: input.isActive ?? null,
    limit: input.limit ?? 50,
  })

  return rows.map(toWandersInbox)
}

/**
 * Update my inbox (anon-only intent; RLS enforces actual ownership).
 * @param {{ inboxId: string, acceptsAnon?: boolean, defaultFolder?: 'inbox'|'requests', isActive?: boolean }} input
 */
export async function updateMyWandersInbox(input) {
  const row = await updateWandersInbox({
    inboxId: input.inboxId,
    acceptsAnon: input.acceptsAnon,
    defaultFolder: input.defaultFolder,
    isActive: input.isActive,
  })

  return toWandersInbox(row)
}
