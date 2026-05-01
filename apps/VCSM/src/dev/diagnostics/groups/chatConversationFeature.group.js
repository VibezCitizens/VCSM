import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  conversationIdFromState,
  getChatConversationFeatureState,
  sendBody,
  withChatConversationContext,
} from "@/dev/diagnostics/groups/chatConversationFeature.group.helpers";
import {
  startDirectConversation,
  openConversation as openConversationController,
  ensureConversationMembership,
  getConversationMembers as getConversationMembersController,
  sendMessage as sendMessageController,
  getConversationMessages as getConversationMessagesController,
  markConversationRead,
  editMessage as editMessageController,
  deleteMessageForSelf as deleteMessageForMeController,
  unsendMessage as unsendMessageController,
  leaveConversation,
  generateClientId,
} from "@chat";
export { getChatConversationFeatureTests } from "@/dev/diagnostics/groups/chatConversationFeature.group.helpers";

export const GROUP_ID = "chatConversationFeature";
export const GROUP_LABEL = "Chat Conversation Feature";

export async function runChatConversationFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "start_direct"),
      name: "start direct conversation via controller",
      run: ({ shared: localShared }) =>
        withChatConversationContext(localShared, "startDirectConversation is blocked by policy, RPC, or seed constraints.", async (context) => {
          if (!context.targetActorId) {
            return makeSkipped("No second actor is visible for direct conversation bootstrap.", { context });
          }
          const started = await startDirectConversation({
            fromActorId: context.actorId,
            realmId: context.realmId,
            picked: { actorId: context.targetActorId },
          });
          if (!started?.conversationId) throw new Error("startDirectConversation returned no conversationId.");
          getChatConversationFeatureState(localShared).conversationId = started.conversationId;
          return { ...context, conversationId: started.conversationId };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "open_conversation"),
      name: "open conversation via controller",
      run: ({ shared: localShared }) =>
        withChatConversationContext(localShared, "openConversation is blocked by policy or RPC availability.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before openConversation test.");
          const opened = await openConversationController({ conversationId, actorId: context.actorId });
          getChatConversationFeatureState(localShared).openConversation = opened ?? null;
          return { conversationId, opened };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "ensure_membership"),
      name: "ensure membership via controller",
      run: ({ shared: localShared }) =>
        withChatConversationContext(localShared, "Conversation membership flow is blocked by policy.", async (context) => {
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
        withChatConversationContext(localShared, "sendMessage flow is blocked by policy or membership constraints.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before send_message_primary test.");
          const sent = await sendMessageController({
            conversationId,
            actorId: context.actorId,
            body: sendBody("Diagnostics chat message"),
            messageKind: "text",
            clientId: generateClientId(),
          });
          getChatConversationFeatureState(localShared).primaryMessageId = sent?.message?.id ?? null;
          return { conversationId, message: sent?.message ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "read_timeline"),
      name: "read timeline via conversation controller",
      run: ({ shared: localShared }) =>
        withChatConversationContext(localShared, "getConversationMessages flow is blocked by policy.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before read_timeline test.");
          const state = getChatConversationFeatureState(localShared);
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
        withChatConversationContext(localShared, "markConversationRead is blocked by policy or membership constraints.", async (context) => {
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
        withChatConversationContext(localShared, "editMessage flow is blocked by policy or sender ownership checks.", async (context) => {
          const messageId = getChatConversationFeatureState(localShared).primaryMessageId ?? null;
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
        withChatConversationContext(localShared, "deleteMessageForMe flow is blocked by policy.", async (context) => {
          const state = getChatConversationFeatureState(localShared);
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
        withChatConversationContext(localShared, "sendMessage for unsend scenario is blocked by policy.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before send_message_unsend test.");
          const sent = await sendMessageController({
            conversationId,
            actorId: context.actorId,
            body: sendBody("Diagnostics unsend candidate"),
            messageKind: "text",
            clientId: generateClientId(),
          });
          getChatConversationFeatureState(localShared).unsendMessageId = sent?.message?.id ?? null;
          return { conversationId, message: sent?.message ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "unsend_message"),
      name: "unsend message via controller",
      run: ({ shared: localShared }) =>
        withChatConversationContext(localShared, "unsendMessage flow is blocked by policy or sender checks.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          const messageId = getChatConversationFeatureState(localShared).unsendMessageId ?? null;
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
        withChatConversationContext(localShared, "leaveConversation flow is blocked by policy.", async (context) => {
          const conversationId = conversationIdFromState(localShared);
          if (!conversationId) return makeSkipped("Conversation was not initialized before leave_conversation test.");
          const leaveResult = await leaveConversation({ conversationId, actorId: context.actorId });
          const { data: inboxAfterLeave, error } = await supabase
            .schema("chat")
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
