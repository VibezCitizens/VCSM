import { getActorSummariesByIds } from '../config.js'
import {
  collectInboxMemberActorIdsNeedingFallback,
  hydrateInboxEntryMemberRows,
} from '../model/lib/memberActorPresentation.js'
import {
  getInboxEntries as getInboxEntriesDAL,
  listActiveConversationMembershipRowsByActorDAL,
  listConversationMemberRowsByConversationIdsDAL,
  listConversationsByIdsDAL,
  listMessageRowsByIdsDAL,
  listRecentMessageRowsByConversationIdsDAL,
  readInboxEntryCountForActorDAL,
} from '../dal/inbox.read.dal.js'
import { getHiddenMessageIdSetDAL } from '../dal/messageVisibility.read.dal.js'

function isDeletedMessage(message) {
  return !!message?.deleted_at
}

function sortInboxRows(rows) {
  return [...rows].sort(
    (a, b) => new Date(b?.last_message_at || 0) - new Date(a?.last_message_at || 0)
  )
}

function buildFallbackInboxRows({
  actorId,
  conversationRows,
  memberRows,
  messageRows,
}) {
  const messageById = new Map(
    (Array.isArray(messageRows) ? messageRows : [])
      .filter((row) => row?.id)
      .map((row) => [row.id, row])
  )

  const membersByConversationId = new Map()
  for (const row of memberRows ?? []) {
    const conversationId = row?.conversation_id
    if (!conversationId) continue

    if (!membersByConversationId.has(conversationId)) {
      membersByConversationId.set(conversationId, [])
    }

    membersByConversationId.get(conversationId).push(row)
  }

  return sortInboxRows(
    (conversationRows ?? []).map((row) => ({
      conversation_id: row.id,
      actor_id: actorId,
      last_message_id: row.last_message_id ?? null,
      last_message_at: row.last_message_at ?? null,
      unread_count: 0,
      pinned: false,
      archived: false,
      muted: false,
      archived_until_new: false,
      history_cutoff_at: null,
      folder: 'inbox',
      last_message: row.last_message_id
        ? messageById.get(row.last_message_id) ?? null
        : null,
      conversation: {
        id: row.id,
        conversation_kind: row.conversation_kind ?? null,
        access_mode: row.access_mode ?? null,
        visibility: row.visibility ?? null,
        scope_kind: row.scope_kind ?? null,
        scope_id: row.scope_id ?? null,
        title: row.title ?? null,
        members: membersByConversationId.get(row.id) ?? [],
      },
    }))
  )
}

async function hydrateInboxMemberActors(rows) {
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) return list

  const actorIds = collectInboxMemberActorIdsNeedingFallback(list)
  if (!actorIds.length) {
    return hydrateInboxEntryMemberRows(list, [])
  }

  const { rows: summaryRows, error } = await getActorSummariesByIds({
    actorIds,
  })

  if (error || !summaryRows?.length) {
    return hydrateInboxEntryMemberRows(list, [])
  }

  return hydrateInboxEntryMemberRows(list, summaryRows)
}

async function loadInboxFallbackFromMembership({ actorId }) {
  let membershipRows = []

  try {
    membershipRows = await listActiveConversationMembershipRowsByActorDAL({
      actorId,
    })
  } catch (error) {
    return []
  }

  const conversationIds = [
    ...new Set(
      membershipRows.map((row) => row?.conversation_id).filter(Boolean)
    ),
  ]

  if (!conversationIds.length) return []

  let conversationRows = []
  let memberRows = []

  try {
    ;[conversationRows, memberRows] = await Promise.all([
      listConversationsByIdsDAL({ conversationIds }),
      listConversationMemberRowsByConversationIdsDAL({ conversationIds }),
    ])
  } catch (error) {
    return []
  }

  const lastMessageIds = [
    ...new Set(
      conversationRows.map((row) => row?.last_message_id).filter(Boolean)
    ),
  ]

  let messageRows = []
  if (lastMessageIds.length) {
    try {
      messageRows = await listMessageRowsByIdsDAL({ messageIds: lastMessageIds })
    } catch (error) {
      // swallow — best-effort backfill
    }
  }

  return buildFallbackInboxRows({
    actorId,
    conversationRows,
    memberRows,
    messageRows,
  })
}

async function backfillMissingLastMessages(rows) {
  const list = (Array.isArray(rows) ? rows : []).map((row) => {
    if (isDeletedMessage(row?.last_message) || !row?.last_message_id) {
      return {
        ...row,
        last_message: null,
        last_message_id: null,
      }
    }

    return row
  })

  const conversationIds = [
    ...new Set(
      list
        .filter((row) => !row?.last_message)
        .map((row) => row?.conversation_id)
        .filter(Boolean)
    ),
  ]

  if (!conversationIds.length) return list

  const limit = Math.min(conversationIds.length * 50, 1000)

  let recentMessages = []
  try {
    recentMessages = await listRecentMessageRowsByConversationIdsDAL({
      conversationIds,
      limit,
    })
  } catch (error) {
    return list
  }

  const newestByConversation = new Map()
  for (const row of recentMessages ?? []) {
    if (!newestByConversation.has(row?.conversation_id)) {
      newestByConversation.set(row.conversation_id, row)
    }
  }

  return list.map((row) => {
    if (row?.last_message || !conversationIds.includes(row?.conversation_id)) {
      return row
    }

    const message = newestByConversation.get(row.conversation_id) ?? null
    if (!message) return row

    return {
      ...row,
      last_message: message,
      last_message_id: message.id,
    }
  })
}

export async function ctrlGetInboxEntries({
  actorId,
  includeArchived = false,
  folder = 'inbox',
}) {
  let rows = await getInboxEntriesDAL({
    actorId,
    includeArchived,
    folder,
  })

  if (rows.length === 0 && folder === 'inbox') {
    let inboxEntryCount = 0

    try {
      inboxEntryCount = await readInboxEntryCountForActorDAL({ actorId })
    } catch (error) {
      // swallow — best-effort check
    }

    if (inboxEntryCount === 0) {
      rows = await loadInboxFallbackFromMembership({ actorId })
    }
  }

  const withBackfilledMessages = await backfillMissingLastMessages(rows)

  // Strip hidden-for-me messages from inbox previews and replace with previous visible message
  let hiddenIds
  try {
    hiddenIds = await getHiddenMessageIdSetDAL({ actorId })
  } catch {
    hiddenIds = new Set()
  }

  let withVisibility = withBackfilledMessages
  if (hiddenIds.size > 0) {
    // Find conversations whose last_message is hidden
    const needsVisibleMessage = withBackfilledMessages
      .filter((row) => row?.last_message_id && hiddenIds.has(row.last_message_id))
      .map((row) => row.conversation_id)
      .filter(Boolean)

    if (needsVisibleMessage.length > 0) {
      // Fetch a batch of recent messages for affected conversations
      let recentMessages = []
      try {
        recentMessages = await listRecentMessageRowsByConversationIdsDAL({
          conversationIds: [...new Set(needsVisibleMessage)],
          limit: Math.min(needsVisibleMessage.length * 20, 500),
        })
      } catch {
        recentMessages = []
      }

      // For each conversation, find the newest message that is NOT hidden and NOT deleted
      const visibleByConversation = new Map()
      for (const msg of recentMessages) {
        if (!msg?.conversation_id || !msg?.id) continue
        if (hiddenIds.has(msg.id)) continue
        if (msg.deleted_at) continue
        if (!visibleByConversation.has(msg.conversation_id)) {
          visibleByConversation.set(msg.conversation_id, msg)
        }
      }

      withVisibility = withBackfilledMessages.map((row) => {
        if (!row?.last_message_id || !hiddenIds.has(row.last_message_id)) return row

        const visible = visibleByConversation.get(row.conversation_id) ?? null
        return {
          ...row,
          last_message: visible,
          last_message_id: visible?.id ?? null,
        }
      })
    }
  }

  const hydrated = await hydrateInboxMemberActors(withVisibility)
  return sortInboxRows(hydrated)
}
