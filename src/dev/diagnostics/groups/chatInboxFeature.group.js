import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureRealm } from "@/dev/diagnostics/helpers/ensureRealm";
import {
  isMissingRpc,
  isPermissionDenied,
  isSeedMissingError,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { startDirectConversation } from "@/features/chat/start/controllers/startDirectConversation.controller";
import { openConversationController } from "@/features/chat/conversation/controllers/openConversation.controller";
import { sendMessageController } from "@/features/chat/conversation/controllers/sendMessage.controller";
import { ctrlGetInboxEntries } from "@/features/chat/inbox/controllers/getInboxEntries.controller";
import { ctrlGetInboxEntryForConversation } from "@/features/chat/inbox/controllers/getInboxEntryForConversation.controller";
import {
  ctrlArchiveConversationForActor,
  ctrlMoveConversationToFolder,
  ctrlUpdateInboxFlags,
} from "@/features/chat/inbox/controllers/inboxActions.controller";
import { deleteThreadForMeController } from "@/features/chat/inbox/controllers/deleteThreadForMe.controller";

export const GROUP_ID = "chatInboxFeature";
export const GROUP_LABEL = "Chat Inbox Feature";

const TEST_CATALOG = [
  { key: "seed_inbox_context", name: "seed inbox context via chat start/controller path" },
  { key: "read_inbox_folder", name: "read inbox folder via inbox controller" },
  { key: "read_inbox_entry", name: "read inbox entry for conversation" },
  { key: "flags_pin_mute_rw", name: "update pin/mute flags via inbox actions controller" },
  { key: "archive_unarchive_flow", name: "archive then unarchive conversation via inbox actions" },
  { key: "spam_folder_flow", name: "move conversation to spam and back to inbox" },
  { key: "requests_folder_flow", name: "move conversation to requests and back to inbox" },
  { key: "delete_thread_for_me", name: "delete thread for me and verify cutoff behavior" },
];

function getState(shared) {
  if (!shared.cache.chatInboxFeatureState) {
    shared.cache.chatInboxFeatureState = {};
  }
  return shared.cache.chatInboxFeatureState;
}

function isBlockedRelationshipError(error) {
  return String(error?.message ?? "").toLowerCase().includes("blocked relationship");
}

function toSkip(error, reason, extra = null) {
  if (
    isPermissionDenied(error) ||
    isMissingRpc(error) ||
    isSeedMissingError(error) ||
    isBlockedRelationshipError(error)
  ) {
    return makeSkipped(reason, { ...extra, error });
  }
  throw error;
}

async function resolveTargetActorId({ actorId, userId }) {
  const { data: ownedActors } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .neq("actor_id", actorId)
    .limit(5);

  if (Array.isArray(ownedActors) && ownedActors.length > 0) {
    return ownedActors[0].actor_id;
  }

  const { data: rows, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(20);

  if (error) throw error;
  return rows?.[0]?.actor_id ?? null;
}

async function ensureContext(shared) {
  const state = getState(shared);
  if (state.actorId && state.userId && state.conversationId) {
    return {
      actorId: state.actorId,
      userId: state.userId,
      conversationId: state.conversationId,
      targetActorId: state.targetActorId ?? null,
    };
  }

  const actorContext = await ensureActorContext(shared);
  const realmContext = await ensureRealm(shared);
  const targetActorId = await resolveTargetActorId({
    actorId: actorContext.actorId,
    userId: actorContext.userId,
  });

  if (!targetActorId) {
    throw makeSkipped("No second actor visible for inbox diagnostics setup.", {
      actorId: actorContext.actorId,
    });
  }

  const started = await startDirectConversation({
    fromActorId: actorContext.actorId,
    realmId: realmContext.realmId,
    picked: { actorId: targetActorId },
  });

  if (!started?.conversationId) {
    throw new Error("startDirectConversation did not return a conversationId for inbox diagnostics.");
  }

  await openConversationController({
    conversationId: started.conversationId,
    actorId: actorContext.actorId,
  });

  const { data: conversation, error: conversationError } = await supabase
    .schema("vc")
    .from("conversations")
    .select("id,last_message_id")
    .eq("id", started.conversationId)
    .maybeSingle();

  if (conversationError) throw conversationError;

  if (!conversation?.last_message_id) {
    const sent = await sendMessageController({
      conversationId: started.conversationId,
      actorId: actorContext.actorId,
      body: `Diagnostics inbox setup ${Date.now()}`,
      messageType: "text",
    });
    state.lastMessageId = sent?.message?.id ?? null;
  } else {
    state.lastMessageId = conversation.last_message_id;
  }

  state.actorId = actorContext.actorId;
  state.userId = actorContext.userId;
  state.targetActorId = targetActorId;
  state.conversationId = started.conversationId;

  return {
    actorId: state.actorId,
    userId: state.userId,
    conversationId: state.conversationId,
    targetActorId: state.targetActorId,
  };
}

async function withContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureContext(localShared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    return toSkip(error, reason, { context });
  }
}

async function moveToInbox(actorId, conversationId) {
  await ctrlMoveConversationToFolder({ actorId, conversationId, folder: "inbox" });
}

export function getChatInboxFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runChatInboxFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "seed_inbox_context"),
      name: "seed inbox context via chat start/controller path",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Inbox context bootstrap is blocked by policy, RPC, or seed constraints.", async (context) => ({
          ...context,
          lastMessageId: getState(localShared).lastMessageId ?? null,
        })),
    },
    {
      id: buildTestId(GROUP_ID, "read_inbox_folder"),
      name: "read inbox folder via inbox controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Inbox folder read is blocked by policy.", async (context) => {
          await moveToInbox(context.actorId, context.conversationId);
          const entries = await ctrlGetInboxEntries({ actorId: context.actorId, folder: "inbox" });
          return {
            conversationId: context.conversationId,
            count: entries?.length ?? 0,
            includesConversation: entries.some((row) => row.conversation_id === context.conversationId),
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "read_inbox_entry"),
      name: "read inbox entry for conversation",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Single inbox entry read is blocked by policy.", async (context) => {
          const entry = await ctrlGetInboxEntryForConversation({
            actorId: context.actorId,
            conversationId: context.conversationId,
          });
          return { conversationId: context.conversationId, entry };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "flags_pin_mute_rw"),
      name: "update pin/mute flags via inbox actions controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Inbox flag update flow is blocked by policy.", async (context) => {
          await ctrlUpdateInboxFlags({ actorId: context.actorId, conversationId: context.conversationId, flags: { pinned: true, muted: true } });
          const { data: setState, error: setStateError } = await supabase
            .schema("vc")
            .from("inbox_entries")
            .select("conversation_id,actor_id,pinned,muted")
            .eq("conversation_id", context.conversationId)
            .eq("actor_id", context.actorId)
            .maybeSingle();
          if (setStateError) throw setStateError;
          await ctrlUpdateInboxFlags({ actorId: context.actorId, conversationId: context.conversationId, flags: { pinned: false, muted: false } });
          return { conversationId: context.conversationId, afterSet: setState ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "archive_unarchive_flow"),
      name: "archive then unarchive conversation via inbox actions",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Archive/unarchive flow is blocked by policy.", async (context) => {
          await ctrlArchiveConversationForActor({ actorId: context.actorId, conversationId: context.conversationId, untilNew: true });
          const archived = await ctrlGetInboxEntryForConversation({ actorId: context.actorId, conversationId: context.conversationId });
          await moveToInbox(context.actorId, context.conversationId);
          const unarchived = await ctrlGetInboxEntryForConversation({ actorId: context.actorId, conversationId: context.conversationId });
          return { conversationId: context.conversationId, archived, unarchived };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "spam_folder_flow"),
      name: "move conversation to spam and back to inbox",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Spam folder move flow is blocked by policy.", async (context) => {
          await ctrlMoveConversationToFolder({ actorId: context.actorId, conversationId: context.conversationId, folder: "spam" });
          const spamEntries = await ctrlGetInboxEntries({ actorId: context.actorId, folder: "spam" });
          await moveToInbox(context.actorId, context.conversationId);
          return {
            conversationId: context.conversationId,
            spamCount: spamEntries?.length ?? 0,
            inSpam: spamEntries.some((row) => row.conversation_id === context.conversationId),
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "requests_folder_flow"),
      name: "move conversation to requests and back to inbox",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Requests folder move flow is blocked by policy.", async (context) => {
          await ctrlMoveConversationToFolder({ actorId: context.actorId, conversationId: context.conversationId, folder: "requests" });
          const requestEntries = await ctrlGetInboxEntries({ actorId: context.actorId, folder: "requests" });
          await moveToInbox(context.actorId, context.conversationId);
          return {
            conversationId: context.conversationId,
            requestCount: requestEntries?.length ?? 0,
            inRequests: requestEntries.some((row) => row.conversation_id === context.conversationId),
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "delete_thread_for_me"),
      name: "delete thread for me and verify cutoff behavior",
      run: ({ shared: localShared }) =>
        withContext(localShared, "deleteThreadForMe flow is blocked by policy.", async (context) => {
          await moveToInbox(context.actorId, context.conversationId);
          await deleteThreadForMeController({
            actorId: context.actorId,
            conversationId: context.conversationId,
            archiveUntilNew: true,
            archive: false,
          });
          const { data: afterDelete, error } = await supabase
            .schema("vc")
            .from("inbox_entries")
            .select("conversation_id,actor_id,last_message_id,last_message_at,history_cutoff_at,archived,archived_until_new,folder")
            .eq("conversation_id", context.conversationId)
            .eq("actor_id", context.actorId)
            .maybeSingle();
          if (error) throw error;
          return { conversationId: context.conversationId, afterDelete };
        }),
    },
  ];

  return runDiagnosticsTests({ group: GROUP_ID, tests, onTestUpdate, shared });
}
