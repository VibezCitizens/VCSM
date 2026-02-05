// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\controllers\wandersCardscontroller.js
// ============================================================================
// WANDERS CONTROLLER — CARDS
// Owns meaning: "send a card into an inbox" and "open/update counters".
// ============================================================================

import {
  createWandersCard,
  getWandersCardById,
  getWandersCardByPublicId,
  listWandersCardsByInboxId,
  updateWandersCard,
} from '@/features/wanders/dal/wandersCards.dal'
import {
  createWandersMailboxItem,
  markWandersMailboxItemReadByCardAndOwnerAnonRole,
} from '@/features/wanders/dal/wandersMailbox.dal'
import { createWandersCardEvent } from '@/features/wanders/dal/wandersEvents.dal'
import { readWandersInboxByPublicId } from '@/features/wanders/controllers/wandersInboxescontroller'
import { ensureWandersAnonIdentity } from '@/features/wanders/controllers/ensureWandersAnoncontroller'
import { toWandersCard } from '@/features/wanders/models/wandersCard.model'

function makePublicId(prefix = 'w_card') {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`
  return `${prefix}_${id}`
}

/**
 * Send a card to an inbox via public inbox id (anon-first sender).
 * Creates:
 * - cards row
 * - mailbox_items for sender/outbox and recipient/inbox (if recipient anon known)
 * - card_events 'created' (and optional 'sent')
 *
 * @param {{
 *  inboxPublicId: string,
 *  realmId?: string,                // optional; will be taken from inbox if omitted
 *  templateKey: string,
 *  messageText?: string|null,
 *  messageCiphertext?: string|null,
 *  messageNonce?: string|null,
 *  messageAlg?: string,
 *  customization?: any,
 *  recipientChannel?: 'link'|'email'|'sms'|'copy',
 *  recipientEmail?: string|null,
 *  recipientPhone?: string|null,
 *  isAnonymous?: boolean,
 *  status?: 'draft'|'sent'|'revoked'|'expired',
 *  sentAt?: string|null
 * }} input
 */
export async function sendWandersCardToInbox(input) {
  const senderAnon = await ensureWandersAnonIdentity({ touch: true })
  const inbox = await readWandersInboxByPublicId({ publicId: input.inboxPublicId })
  if (!inbox) throw new Error('Inbox not found')

  // Controller meaning: if inbox is inactive, do not send.
  if (!inbox.isActive) throw new Error('Inbox inactive')

  // Controller meaning: if inbox does not accept anon, do not send (anon-first).
  if (!inbox.acceptsAnon) throw new Error('Inbox does not accept anon')

  const nowIso = new Date().toISOString()
  const cardRow = await createWandersCard({
    public_id: makePublicId(),
    realmId: input.realmId ?? inbox.realmId,
    status: input.status ?? 'sent',
    sentAt: input.sentAt ?? nowIso,

    senderActorId: null,
    senderAnonId: senderAnon.id,

    recipientActorId: inbox.ownerActorId ?? null,
    recipientAnonId: inbox.ownerAnonId ?? null,

    recipientChannel: input.recipientChannel ?? 'link',
    recipientEmail: input.recipientEmail ?? null,
    recipientPhone: input.recipientPhone ?? null,

    isAnonymous: input.isAnonymous ?? true,

    messageText: input.messageText ?? null,
    messageCiphertext: input.messageCiphertext ?? null,
    messageNonce: input.messageNonce ?? null,
    messageAlg: input.messageAlg ?? 'xchacha20poly1305',

    templateKey: input.templateKey,
    customization: input.customization ?? {},

    inboxId: inbox.id,
  })

  // Sender mailbox (outbox)
  await createWandersMailboxItem({
    cardId: cardRow.id,
    ownerAnonId: senderAnon.id,
    ownerActorId: null,
    ownerRole: 'sender',
    folder: 'outbox',
  })

  // Recipient mailbox (inbox/requests). Default folder from inbox.
  if (inbox.ownerAnonId) {
    await createWandersMailboxItem({
      cardId: cardRow.id,
      ownerAnonId: inbox.ownerAnonId,
      ownerActorId: null,
      ownerRole: 'recipient',
      folder: inbox.defaultFolder ?? 'inbox',
    })
  } else if (inbox.ownerActorId) {
    // actor path later; keep a mailbox record if your RLS allows it
    await createWandersMailboxItem({
      cardId: cardRow.id,
      ownerActorId: inbox.ownerActorId,
      ownerAnonId: null,
      ownerRole: 'recipient',
      folder: inbox.defaultFolder ?? 'inbox',
    })
  }

  // Event: created + sent
  await createWandersCardEvent({
    cardId: cardRow.id,
    anonId: senderAnon.id,
    actorId: null,
    eventType: 'created',
    meta: { inbox_id: inbox.id },
  })

  await createWandersCardEvent({
    cardId: cardRow.id,
    anonId: senderAnon.id,
    actorId: null,
    eventType: 'sent',
    meta: { inbox_id: inbox.id },
  })

  return toWandersCard(cardRow)
}

/**
 * Read card by id.
 * @param {{ cardId: string }} input
 */
export async function readWandersCardById(input) {
  const row = await getWandersCardById(input.cardId)
  return toWandersCard(row)
}

/**
 * Read card by public id.
 * @param {{ publicId: string }} input
 */
export async function readWandersCardByPublicId(input) {
  const row = await getWandersCardByPublicId(input.publicId)
  return toWandersCard(row)
}

/**
 * List cards by inbox id (owner/participant visibility is enforced by RLS).
 * @param {{ inboxId: string, limit?: number }} input
 */
export async function listCardsForInbox(input) {
  const rows = await listWandersCardsByInboxId({
    inboxId: input.inboxId,
    limit: input.limit ?? 50,
  })
  return rows.map(toWandersCard)
}

/**
 * Mark card as opened (recipient-side intent).
 * Controller does the meaning; RLS should still constrain who can update.
 * Also:
 * - ensures opener anon identity
 * - attaches recipient_anon_id on first open for link cards (if opener != sender)
 * - marks recipient mailbox as read (update if exists, insert if missing)
 *
 * @param {{ cardId: string }} input
 */
export async function markWandersCardOpened(input) {
  const nowIso = new Date().toISOString()
  const anon = await ensureWandersAnonIdentity({ touch: true })

  // Read first to increment cleanly
  const current = await getWandersCardById(input.cardId)
  if (!current) throw new Error('Card not found')

  const isSender = Boolean(current.sender_anon_id && current.sender_anon_id === anon.id)

  // If link-shared card has no recipient yet and opener is not sender, attach recipient (best-effort)
  let effectiveRecipientAnonId = current.recipient_anon_id ?? null
  if (!effectiveRecipientAnonId && current.sender_anon_id && !isSender) {
    try {
      const updatedRecipient = await updateWandersCard({
        cardId: input.cardId,
        patch: {
          recipient_anon_id: anon.id,
          recipient_channel: current.recipient_channel ?? 'link',
        },
      })
      effectiveRecipientAnonId = updatedRecipient?.recipient_anon_id ?? anon.id
    } catch {
      // non-blocking
      effectiveRecipientAnonId = null
    }
  }

  const nextCount = (current.open_count ?? 0) + 1

  // IMPORTANT: patch keys MUST match DB column names (snake_case)
  const updated = await updateWandersCard({
    cardId: input.cardId,
    patch: {
      opened_at: current.opened_at ?? nowIso,
      last_opened_at: nowIso,
      open_count: nextCount,
    },
  })

  // Event: opened (best-effort)
  try {
    await createWandersCardEvent({
      cardId: input.cardId,
      anonId: anon.id,
      actorId: null,
      eventType: 'opened',
      meta: { open_count: nextCount, via: 'public_link' },
    })
  } catch {
    // non-blocking
  }

  // If opener is the recipient (or became the recipient), mark mailbox read
  const openerIsRecipient = Boolean(effectiveRecipientAnonId && effectiveRecipientAnonId === anon.id)
  if (openerIsRecipient) {
    try {
      await markWandersMailboxItemReadByCardAndOwnerAnonRole({
        cardId: input.cardId,
        ownerAnonId: anon.id,
        ownerRole: 'recipient',
      })
    } catch {
      // non-blocking: might be blocked by RLS
    }
  }

  return toWandersCard(updated)
}
