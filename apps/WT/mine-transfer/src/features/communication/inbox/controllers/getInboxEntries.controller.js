import { getActorSummariesByIdsDAL } from "@/features/actors/dal/getActorSummariesByIds.dal";
import {
  collectInboxMemberActorIdsNeedingFallback,
  hydrateInboxEntryMemberRows,
} from "@/features/chat/conversation/lib/memberActorPresentation";
import {
  getInboxEntries as getInboxEntriesDAL,
  listActiveConversationMembershipRowsByActorDAL,
  listConversationMemberRowsByConversationIdsDAL,
  listConversationsByIdsDAL,
  listMessageRowsByIdsDAL,
  listRecentMessageRowsByConversationIdsDAL,
  readInboxEntryCountForActorDAL,
} from "@/features/chat/inbox/dal/inbox.read.dal";

function isDeletedMessage(message) {
  return !!message?.deleted_at;
}

function sortInboxRows(rows) {
  return [...rows].sort(
    (a, b) => new Date(b?.last_message_at || 0) - new Date(a?.last_message_at || 0)
  );
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
  );

  const membersByConversationId = new Map();
  for (const row of memberRows ?? []) {
    const conversationId = row?.conversation_id;
    if (!conversationId) continue;

    if (!membersByConversationId.has(conversationId)) {
      membersByConversationId.set(conversationId, []);
    }

    membersByConversationId.get(conversationId).push(row);
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
      folder: "inbox",
      last_message: row.last_message_id
        ? messageById.get(row.last_message_id) ?? null
        : null,
      conversation: {
        members: membersByConversationId.get(row.id) ?? [],
      },
    }))
  );
}

async function hydrateInboxMemberActors(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return list;

  const actorIds = collectInboxMemberActorIdsNeedingFallback(list);
  if (!actorIds.length) {
    return hydrateInboxEntryMemberRows(list, []);
  }

  const { rows: summaryRows, error } = await getActorSummariesByIdsDAL({
    actorIds,
  });

  if (error || !summaryRows?.length) {
    return hydrateInboxEntryMemberRows(list, []);
  }

  return hydrateInboxEntryMemberRows(list, summaryRows);
}

async function loadInboxFallbackFromMembership({ actorId }) {
  let membershipRows = [];

  try {
    membershipRows = await listActiveConversationMembershipRowsByActorDAL({
      actorId,
    });
  } catch (error) {
    console.error("[ctrlGetInboxEntries] fallback memberships error", error);
    return [];
  }

  const conversationIds = [
    ...new Set(
      membershipRows.map((row) => row?.conversation_id).filter(Boolean)
    ),
  ];

  if (!conversationIds.length) return [];

  let conversationRows = [];
  let memberRows = [];

  try {
    [conversationRows, memberRows] = await Promise.all([
      listConversationsByIdsDAL({ conversationIds }),
      listConversationMemberRowsByConversationIdsDAL({ conversationIds }),
    ]);
  } catch (error) {
    console.error("[ctrlGetInboxEntries] fallback conversation load error", error);
    return [];
  }

  const lastMessageIds = [
    ...new Set(
      conversationRows.map((row) => row?.last_message_id).filter(Boolean)
    ),
  ];

  let messageRows = [];
  if (lastMessageIds.length) {
    try {
      messageRows = await listMessageRowsByIdsDAL({ messageIds: lastMessageIds });
    } catch (error) {
      console.error("[ctrlGetInboxEntries] fallback last messages error", error);
    }
  }

  return buildFallbackInboxRows({
    actorId,
    conversationRows,
    memberRows,
    messageRows,
  });
}

async function backfillMissingLastMessages(rows) {
  const list = (Array.isArray(rows) ? rows : []).map((row) => {
    if (isDeletedMessage(row?.last_message) || !row?.last_message_id) {
      return {
        ...row,
        last_message: null,
        last_message_id: null,
      };
    }

    return row;
  });

  const conversationIds = [
    ...new Set(
      list
        .filter((row) => !row?.last_message)
        .map((row) => row?.conversation_id)
        .filter(Boolean)
    ),
  ];

  if (!conversationIds.length) return list;

  const limit = Math.min(conversationIds.length * 50, 1000);

  let recentMessages = [];
  try {
    recentMessages = await listRecentMessageRowsByConversationIdsDAL({
      conversationIds,
      limit,
    });
  } catch (error) {
    console.error("[ctrlGetInboxEntries] backfill messages error", error);
    return list;
  }

  const newestByConversation = new Map();
  for (const row of recentMessages ?? []) {
    if (!newestByConversation.has(row?.conversation_id)) {
      newestByConversation.set(row.conversation_id, row);
    }
  }

  return list.map((row) => {
    if (row?.last_message || !conversationIds.includes(row?.conversation_id)) {
      return row;
    }

    const message = newestByConversation.get(row.conversation_id) ?? null;
    if (!message) return row;

    return {
      ...row,
      last_message: message,
      last_message_id: message.id,
    };
  });
}

export async function ctrlGetInboxEntries({
  actorId,
  includeArchived = false,
  folder = "inbox",
}) {
  let rows = await getInboxEntriesDAL({
    actorId,
    includeArchived,
    folder,
  });

  if (rows.length === 0 && folder === "inbox") {
    let inboxEntryCount = 0;

    try {
      inboxEntryCount = await readInboxEntryCountForActorDAL({ actorId });
    } catch (error) {
      console.error("[ctrlGetInboxEntries] metadata existence check failed", error);
    }

    if (inboxEntryCount === 0) {
      rows = await loadInboxFallbackFromMembership({ actorId });
    }
  }

  const withBackfilledMessages = await backfillMissingLastMessages(rows);
  return hydrateInboxMemberActors(withBackfilledMessages);
}
