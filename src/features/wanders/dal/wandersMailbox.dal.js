// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\dal\wandersMailbox.dal.js
// ============================================================================
// WANDERS DAL — MAILBOX ITEMS
// Contract: raw rows only, explicit selects, no derived meaning.

// CAN BE DELETED LEGACY
// ============================================================================

import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

const SCHEMA = 'wanders'
const TABLE = 'mailbox_items'

const COLS = [
  'id',
  'card_id',
  'owner_actor_id',
  'owner_anon_id',
  'owner_role',
  'folder',
  'pinned',
  'archived',
  'is_read',
  'read_at',
  'created_at',
  'updated_at',
].join(',')

const CARD_COLS = [
  'id',
  'public_id',
  'realm_id',
  'status',
  'sent_at',
  'expires_at',
  'sender_actor_id',
  'sender_anon_id',
  'recipient_actor_id',
  'recipient_anon_id',
  'recipient_channel',
  'recipient_email',
  'recipient_phone',
  'is_anonymous',
  'message_text',
  'message_ciphertext',
  'message_nonce',
  'message_alg',
  'template_key',
  'customization',
  'opened_at',
  'last_opened_at',
  'open_count',
  'sender_claim_token',
  'recipient_claim_token',
  'is_void',
  'inbox_id',
  'created_at',
  'updated_at',
].join(',')

const COLS_WITH_CARD = `${COLS},card:cards(${CARD_COLS})`

export async function createWandersMailboxItem(input) {
  const supabase = getWandersSupabase()

  const payload = {
    card_id: input.cardId,
    owner_actor_id: input.ownerActorId ?? null,
    owner_anon_id: input.ownerAnonId ?? null,
    owner_role: input.ownerRole,
    folder: input.folder ?? 'inbox',
    pinned: input.pinned ?? false,
    archived: input.archived ?? false,
    is_read: input.isRead ?? false,
    read_at: input.readAt ?? null,
  }

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS_WITH_CARD)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getWandersMailboxItemById(itemId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_WITH_CARD)
    .eq('id', itemId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function listWandersMailboxItemsByOwnerActorId(input) {
  const supabase = getWandersSupabase()

  let q = supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_WITH_CARD)
    .eq('owner_actor_id', input.ownerActorId)

  if (input.folder) q = q.eq('folder', input.folder)
  if (input.ownerRole) q = q.eq('owner_role', input.ownerRole)
  if (input.limit) q = q.limit(input.limit)

  const { data, error } = await q.order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function listWandersMailboxItemsByOwnerAnonId(input) {
  const supabase = getWandersSupabase()

  let q = supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_WITH_CARD)
    .eq('owner_anon_id', input.ownerAnonId)

  if (input.folder) q = q.eq('folder', input.folder)
  if (input.ownerRole) q = q.eq('owner_role', input.ownerRole)
  if (input.limit) q = q.limit(input.limit)

  const { data, error } = await q.order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function updateWandersMailboxItem(input) {
  const supabase = getWandersSupabase()

  const patch = {}

  if (input.folder !== undefined) patch.folder = input.folder
  if (input.pinned !== undefined) patch.pinned = input.pinned
  if (input.archived !== undefined) patch.archived = input.archived
  if (input.isRead !== undefined) patch.is_read = input.isRead
  if (input.readAt !== undefined) patch.read_at = input.readAt

  patch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq('id', input.itemId)
    .select(COLS_WITH_CARD)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getWandersMailboxItemByCardAndOwnerAnonRole(input) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_WITH_CARD)
    .eq('card_id', input.cardId)
    .eq('owner_anon_id', input.ownerAnonId)
    .eq('owner_role', input.ownerRole)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertWandersMailboxItemByCardAndOwnerAnonRole(input) {
  const existing = await getWandersMailboxItemByCardAndOwnerAnonRole({
    cardId: input.cardId,
    ownerAnonId: input.ownerAnonId,
    ownerRole: input.ownerRole,
  })

  if (existing?.id) {
    return updateWandersMailboxItem({
      itemId: existing.id,
      folder: input.folder,
      pinned: input.pinned,
      archived: input.archived,
      isRead: input.isRead,
      readAt: input.readAt,
    })
  }

  return createWandersMailboxItem({
    cardId: input.cardId,
    ownerAnonId: input.ownerAnonId,
    ownerActorId: null,
    ownerRole: input.ownerRole,
    folder: input.folder ?? 'inbox',
    pinned: input.pinned ?? false,
    archived: input.archived ?? false,
    isRead: input.isRead ?? false,
    readAt: input.readAt ?? null,
  })
}

export async function markWandersMailboxItemReadByCardAndOwnerAnonRole(input) {
  const nowIso = new Date().toISOString()

  return upsertWandersMailboxItemByCardAndOwnerAnonRole({
    cardId: input.cardId,
    ownerAnonId: input.ownerAnonId,
    ownerRole: input.ownerRole,
    folder: 'inbox',
    isRead: true,
    readAt: nowIso,
  })
}
