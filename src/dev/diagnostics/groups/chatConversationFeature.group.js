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
import { ensureConversationMembership } from "@/features/chat/conversation/controllers/ensureConversationMembership.controller";
import { getConversationMembersController } from "@/features/chat/conversation/controllers/message-actions/getConversationMembers.controller";
import { sendMessageController } from "@/features/chat/conversation/controllers/sendMessage.controller";
import { getConversationMessagesController } from "@/features/chat/conversation/controllers/getConversationMessages.controller";
import { markConversationRead } from "@/features/chat/conversation/controllers/markConversationRead.controller";
import { editMessageController } from "@/features/chat/conversation/controllers/message-actions/editMessage.controller";
import { deleteMessageForMeController } from "@/features/chat/conversation/controllers/message-actions/deleteMessageForMe.controller";
import { unsendMessageController } from "@/features/chat/conversation/controllers/message-actions/unsendMessage.controller";
import { leaveConversation } from "@/features/chat/conversation/controllers/leaveConversation.controller";
import { generateClientId } from "@/features/chat/conversation/features/messages/generateClientId";

export const GROUP_ID = "chatConversationFeature";
export const GROUP_LABEL = "Chat Conversation Feature";

const TEST_CATALOG = [
  { key: "start_direct", name: "start direct conversation via controller" },
  { key: "open_conversation", name: "open conversation via controller" },
  { key: "ensure_membership", name: "ensure membership via controller" },
  { key: "send_message_primary", name: "send message via conversation controller" },
  { key: "read_timeline", name: "read timeline via conversation controller" },
  { key: "mark_read", name: "mark conversation read via controller" },
  { key: "edit_message", name: "edit own message via controller" },
  { key: "delete_for_me", name: "delete message for me via controller" },
  { key: "send_message_unsend", name: "send second message for unsend test" },
  { key: "unsend_message", name: "unsend message via controller" },
  { key: "leave_conversation", name: "leave conversation via controller" },
];

function getState(shared) {
  if (!shared.cache.chatConversationFeatureState) {
    shared.cache.chatConversationFeatureState = {};
  }
  return shared.cache.chatConversationFeatureState;
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

async function findSecondActorId({ actorId, userId }) {
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
  if (state.actorId && state.userId && state.realmId) {
    return {
      actorId: state.actorId,
      userId: state.userId,
      realmId: state.realmId,
      targetActorId: state.targetActorId ?? null,
    };
  }

  const actorContext = await ensureActorContext(shared);
  const realmContext = await ensureRealm(shared);
  state.actorId = actorContext.actorId;
  state.userId = actorContext.userId;
  state.realmId = realmContext.realmId;
  state.targetActorId = await findSecondActorId({
    actorId: actorContext.actorId,
    userId: actorContext.userId,
  });

  return {
    actorId: state.actorId,
    userId: state.userId,
    realmId: state.realmId,
    targetActorId: state.targetActorId,
  };
}

function conversationIdFromState(shared) {
  return getState(shared).conversationId ?? null;
}

async function withContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureContext(localShared);
    return await run(context);
  } catch (error) {
    return toSkip(error, reason, { context });
  }
}

function sendBody(prefix) {
  return `${prefix} ${Date.now()}`;
}

export function getChatConversationFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runChatConversationFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "start_direct"),
      name: "start direct conversation via controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "startDirectConversation is blocked by policy, RPC, or seed constraints.", async (context) => {
          if (!context.targetActorId) {
            return makeSkipped("No second actor is visible for direct conversation bootstrap.", { context });
          }
          const started = await startDirectConversation({
            fromActorId: context.actorId,
            realmId: context.realmId,
            picked: { actorId: context.targetActorId },
          });
          if (!started?.conversationId) throw new Error("startDirectConversation returned no conversationId.");
          getState(localShared).conversationId = started.conversationId;
          return { ...context, conversationId: started.conversationId };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "open_conversation"),
      name: "open conversation via controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "openConversation is blocked by policy or RPC availability.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before openConversation test.");
          const opened = await openConversationController({ conversationId, actorId: context.actorId });
          getState(localShared).openConversation = opened ?? null;
          return { conversationId, opened };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "ensure_membership"),
      name: "ensure membership via controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Conversation membership flow is blocked by policy.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before membership test.");
          await ensureConversationMembership({ conversationId, actorId: context.actorId });
          const membership = await getConversationMembersController({ conversationId, actorId: context.actorId });
          return { conversationId, me: membership?.me ?? null, memberCount: membership?.members?.length ?? 0 };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "send_message_primary"),
      name: "send message via conversation controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "sendMessage flow is blocked by policy or membership constraints.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before send_message_primary test.");
          const sent = await sendMessageController({
            conversationId,
            actorId: context.actorId,
            body: sendBody("Diagnostics chat message"),
            messageType: "text",
            clientId: generateClientId(),
          });
          getState(localShared).primaryMessageId = sent?.message?.id ?? null;
          return { conversationId, message: sent?.message ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "read_timeline"),
      name: "read timeline via conversation controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "getConversationMessages flow is blocked by policy.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before read_timeline test.");
          const state = getState(localShared);
          const messages = await getConversationMessagesController({ conversationId, actorId: context.actorId, limit: 50 });
          return {
            conversationId,
            messageCount: messages?.length ?? 0,
            primaryMessageId: state.primaryMessageId ?? null,
            primaryVisible: state.primaryMessageId ? messages.some((m) => m.id === state.primaryMessageId) : null,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "mark_read"),
      name: "mark conversation read via controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "markConversationRead is blocked by policy or membership constraints.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before mark_read test.");
          const result = await markConversationRead({ conversationId, actorId: context.actorId });
          return { conversationId, result };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "edit_message"),
      name: "edit own message via controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "editMessage flow is blocked by policy or sender ownership checks.", async (context) => {
          const messageId = getState(localShared).primaryMessageId ?? null;
          if (!messageId) return makeSkipped("Primary message was not created before edit_message test.");
          const edited = await editMessageController({
            actorId: context.actorId,
            messageId,
            body: sendBody("Diagnostics edited message"),
          });
          return { messageId, editedMessage: edited?.message ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "delete_for_me"),
      name: "delete message for me via controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "deleteMessageForMe flow is blocked by policy.", async (context) => {
          const state = getState(localShared);
          const conversationId = conversationIdFromState(localShared);
          const messageId = state.primaryMessageId ?? null;
          if (!conversationId || !messageId) return makeSkipped("Conversation/message context missing before delete_for_me test.");
          const deletion = await deleteMessageForMeController({ actorId: context.actorId, messageId, conversationId });
          const messages = await getConversationMessagesController({ conversationId, actorId: context.actorId, limit: 50 });
          return { conversationId, messageId, deletion, stillVisible: messages.some((m) => m.id === messageId) };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "send_message_unsend"),
      name: "send second message for unsend test",
      run: ({ shared: localShared }) =>
        withContext(localShared, "sendMessage for unsend scenario is blocked by policy.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before send_message_unsend test.");
          const sent = await sendMessageController({
            conversationId,
            actorId: context.actorId,
            body: sendBody("Diagnostics unsend candidate"),
            messageType: "text",
            clientId: generateClientId(),
          });
          getState(localShared).unsendMessageId = sent?.message?.id ?? null;
          return { conversationId, message: sent?.message ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "unsend_message"),
      name: "unsend message via controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "unsendMessage flow is blocked by policy or sender checks.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          const messageId = getState(localShared).unsendMessageId ?? null;
          if (!conversationId || !messageId) return makeSkipped("Unsend target message was not created before unsend_message test.");
          const unsendResult = await unsendMessageController({ actorId: context.actorId, messageId });
          const messages = await getConversationMessagesController({ conversationId, actorId: context.actorId, limit: 50 });
          return { conversationId, messageId, unsendResult, unsentMessage: messages.find((m) => m.id === messageId) ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "leave_conversation"),
      name: "leave conversation via controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "leaveConversation flow is blocked by policy.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before leave_conversation test.");
          const leaveResult = await leaveConversation({ conversationId, actorId: context.actorId });
          const { data: inboxAfterLeave, error } = await supabase
            .schema("vc")
            .from("inbox_entries")
            .select("conversation_id,actor_id,folder,archived,archived_until_new,unread_count")
            .eq("conversation_id", conversationId)
            .eq("actor_id", context.actorId)
            .maybeSingle();
          if (error) throw error;
          return { conversationId, leaveResult, inboxAfterLeave: inboxAfterLeave ?? null };
        }),
    },
  ];

  return runDiagnosticsTests({ group: GROUP_ID, tests, onTestUpdate, shared });
}
