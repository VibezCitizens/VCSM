// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\controllers\wandersCardsPublic.controller.js
// ============================================================================
// WANDERS CONTROLLER — PUBLIC CARD OPEN
// ============================================================================

import { ensureWandersAnonIdentity } from '@/features/wanders/controllers/ensureWandersAnoncontroller'
import { getWandersCardById, updateWandersCard } from '@/features/wanders/dal/wandersCards.dal'
import { createWandersCardEvent } from '@/features/wanders/dal/wandersEvents.dal'
import { createWandersMailboxItem, updateWandersMailboxItem } from '@/features/wanders/dal/wandersMailbox.dal'

/**
 * Mark a card as opened by the current anon.
 * - increments cards.open_count
 * - sets opened_at (first time) + last_opened_at (always)
 * - writes card_events.opened (best-effort)
 * - if opener is recipient (or becomes recipient on first interaction), ensure recipient mailbox item is_read=true
 *
 * @param {{ cardId: string }} input
 */
export async function markCardOpenedAsAnon(input) {
  const anon = await ensureWandersAnonIdentity({ touch: true })

  const card = await getWandersCardById(input.cardId)
  if (!card) throw new Error('Card not found')

  const isSender = Boolean(card.sender_anon_id && card.sender_anon_id === anon.id)

  // If link-shared card has no recipient yet, and opener is not the sender:
  // attach opener as recipient (best-effort).
  let effectiveRecipientAnonId = card.recipient_anon_id ?? null
  if (!effectiveRecipientAnonId && card.sender_anon_id && !isSender) {
    try {
      const updated = await updateWandersCard({
        cardId: card.id,
        patch: {
          recipient_anon_id: anon.id,
          recipient_channel: card.recipient_channel ?? 'link',
        },
      })
      effectiveRecipientAnonId = updated?.recipient_anon_id ?? anon.id
    } catch {
      // non-blocking
      effectiveRecipientAnonId = null
    }
  }

  // Update open counters/timestamps.
  // NOTE: This uses read-modify-write if your DAL doesn't support atomic increments.
  // If you have many opens concurrently, you should do an atomic SQL update in DAL (see section 3).
  const nowIso = new Date().toISOString()
  const nextOpenCount = Number(card.open_count ?? 0) + 1

  let updatedCard = card
  try {
    updatedCard = await updateWandersCard({
      cardId: card.id,
      patch: {
        open_count: nextOpenCount,
        opened_at: card.opened_at ?? nowIso,
        last_opened_at: nowIso,
      },
    })
  } catch {
    // If RLS blocks, still continue; event/mailbox are best-effort anyway.
    updatedCard = card
  }

  // Event: opened (best-effort)
  try {
    await createWandersCardEvent({
      cardId: card.id,
      anonId: anon.id,
      actorId: null,
      eventType: 'opened',
      meta: {
        via: 'public_link',
      },
    })
  } catch {
    // non-blocking
  }

  // If opener is recipient (or became recipient), mark recipient mailbox item as read.
  // IMPORTANT: do NOT mark "read" for the sender opening their own outbox link.
  const openerIsRecipient = Boolean(effectiveRecipientAnonId && effectiveRecipientAnonId === anon.id)

  if (openerIsRecipient) {
    // Ensure mailbox exists (best-effort)
    try {
      await createWandersMailboxItem({
        cardId: card.id,
        ownerAnonId: anon.id,
        ownerActorId: null,
        ownerRole: 'recipient',
        folder: 'inbox',
      })
    } catch {
      // ignore (might already exist, or RLS)
    }

    // Mark read (best-effort) — requires DAL support
    try {
      await updateWandersMailboxItem({
        cardId: card.id,
        ownerAnonId: anon.id,
        ownerRole: 'recipient',
        patch: {
          is_read: true,
          read_at: nowIso,
        },
      })
    } catch {
      // non-blocking
    }
  }

  return updatedCard
}
