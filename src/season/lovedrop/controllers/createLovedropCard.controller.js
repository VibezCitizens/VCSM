// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\controllers\createLovedropCard.controller.js
// ============================================================================
// LOVE DROP CONTROLLER — CREATE CARD
// Contract: owns meaning + validation for "create" action.
// ============================================================================

import {
  createLovedropCard as createLovedropCardRow,
  getLovedropCardByPublicId,
} from '@/season/lovedrop/dal/lovedropCards.dal'
import { createLovedropOutboxItem } from '@/season/lovedrop/dal/lovedropOutbox.dal' // ✅ ADD
import { lovedropCardFromRow } from '@/season/lovedrop/model/lovedropCard.model'
import { ensureLovedropAnonIdentity } from '@/season/lovedrop/controllers/ensureLovedropAnon.controller'

function randomBase62Char() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const idx = Math.floor(Math.random() * chars.length)
  return chars[idx]
}

function generatePublicId(len = 8) {
  let out = ''
  for (let i = 0; i < len; i++) out += randomBase62Char()
  return out
}

function safeTrim(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

/**
 * Create a LoveDrop card and return share URL.
 *
 * DB constraints to respect:
 * - realm_id NOT NULL
 * - template_key NOT NULL
 */
export async function createLovedropCard(input) {
  const realmId = input?.realmId ?? null
  if (!realmId) {
    const err = new Error('realmId is required')
    err.code = 'LOVEDROP_REALM_ID_REQUIRED'
    throw err
  }

  const templateKey = safeTrim(input?.templateKey)
  if (!templateKey) {
    const err = new Error('templateKey is required')
    err.code = 'LOVEDROP_TEMPLATE_KEY_REQUIRED'
    throw err
  }

  const messageText = safeTrim(input?.messageText)

  // Generate a unique public_id (retry on collision)
  let publicId = null
  const maxAttempts = 6

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = generatePublicId(8)
    const existing = await getLovedropCardByPublicId(candidate)
    if (!existing) {
      publicId = candidate
      break
    }
  }

  if (!publicId) {
    const err = new Error('Failed to generate unique publicId')
    err.code = 'LOVEDROP_PUBLIC_ID_GENERATION_FAILED'
    throw err
  }

  const nowIso = new Date().toISOString()

  // ✅ RLS FIX: ensure sender_anon_id if no actor
  const senderActorId = input?.senderActorId ?? null
  let senderAnonId = input?.senderAnonId ?? null

  if (!senderActorId && !senderAnonId) {
    const anon = await ensureLovedropAnonIdentity({
      clientKey: input?.clientKey ?? null,
    })
    senderAnonId = anon?.id ?? null
  }

  // default status = 'sent'
  const status = input?.status ?? 'sent'

  const sentAt =
    status === 'sent' ? (input?.sentAt ?? nowIso) : (input?.sentAt ?? null)

  const row = {
    public_id: publicId,
    realm_id: realmId,

    status,
    created_at: nowIso,
    updated_at: nowIso,

    sent_at: sentAt,
    expires_at: input?.expiresAt ?? null,

    sender_actor_id: senderActorId,
    sender_anon_id: senderAnonId,

    recipient_actor_id: input?.recipientActorId ?? null,
    recipient_anon_id: input?.recipientAnonId ?? null,
    recipient_email: input?.recipientEmail ?? null,
    recipient_phone: input?.recipientPhone ?? null,
    recipient_channel: input?.recipientChannel ?? 'link',

    is_anonymous: input?.isAnonymous !== undefined ? !!input.isAnonymous : true,

    message_text: messageText || null,

    template_key: templateKey,
    customization: input?.customization ?? {},

    is_void: false,
  }

  const createdRow = await createLovedropCardRow(row)

  // ✅ ADD: write to sender outbox so you can list all cards later
  // (if this fails, the card still exists, so don't break create UX)
  try {
    await createLovedropOutboxItem({
      cardId: createdRow.id,
      ownerActorId: senderActorId,
      ownerAnonId: senderAnonId,
    })
  } catch (e) {
    console.warn('[Lovedrop] failed to insert outbox item', e)
  }

  const baseUrl = safeTrim(input?.baseUrl) || ''

  // ✅ URL for recipient view
  const url = baseUrl
    ? `${baseUrl.replace(/\/+$/, '')}/lovedrop/v/${publicId}`
    : `/lovedrop/v/${publicId}`

  return {
    publicId,
    url,
    card: lovedropCardFromRow(createdRow),
  }
}
