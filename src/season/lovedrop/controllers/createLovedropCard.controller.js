// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\controllers\createLovedropCard.controller.js
// ============================================================================
// LOVE DROP CONTROLLER — CREATE CARD
// Contract: owns meaning + validation for "create" action.
// ============================================================================

import {
  createLovedropCard as createLovedropCardRow,
  getLovedropCardByPublicId,
} from '@/season/lovedrop/dal/lovedropCards.dal'
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
 *
 * @param {{
 *  realmId: string,
 *  status?: 'draft'|'sent'|'revoked'|'expired',
 *  senderActorId?: string|null,
 *  senderAnonId?: string|null,
 *  clientKey?: string|null,
 *  recipientActorId?: string|null,
 *  recipientAnonId?: string|null,
 *  recipientEmail?: string|null,
 *  recipientPhone?: string|null,
 *  recipientChannel?: 'link'|'email'|'sms'|'copy'|string|null,
 *  isAnonymous?: boolean,
 *  messageText?: string|null,
 *  templateKey: string,
 *  customization?: object|null,
 *  expiresAt?: string|null, // ISO
 *  sentAt?: string|null, // ISO
 *  baseUrl?: string|null, // e.g. https://vibez.xxx
 * }} input
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

  // ✅ RLS FIX:
  // If creating as anon (no actor), we must ensure sender_anon_id is set,
  // otherwise vc.lovedrop_cards_anon_insert will reject the row.
  const senderActorId = input?.senderActorId ?? null
  let senderAnonId = input?.senderAnonId ?? null

  if (!senderActorId && !senderAnonId) {
    const anon = await ensureLovedropAnonIdentity({
      clientKey: input?.clientKey ?? null,
    })
    senderAnonId = anon?.id ?? null
  }

  // ✅ OPTION A: Create means shareable immediately => default status = 'sent'
  const status = input?.status ?? 'sent'

  // If sent, ensure sent_at is set (required for analytics/ordering)
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

    // plaintext optional; you already have cipher fields if you want later
    message_text: messageText || null,

    template_key: templateKey,
    customization: input?.customization ?? {},

    is_void: false,
  }

  const createdRow = await createLovedropCardRow(row)

  const baseUrl = safeTrim(input?.baseUrl) || ''

  // ✅ UPDATED: match routes: /lovedrop/v/:publicId
  const url = baseUrl
    ? `${baseUrl.replace(/\/+$/, '')}/lovedrop/v/${publicId}`
    : `/lovedrop/v/${publicId}`

  return {
    publicId,
    url,
    card: lovedropCardFromRow(createdRow),
  }
}
