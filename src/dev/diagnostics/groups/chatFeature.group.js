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
import { auditFeature } from "@/dev/diagnostics/helpers/featureAudit";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";
import { InboxScreen as ChatInboxScreen, ConversationScreen as ChatConversationScreen } from "@/features/chat";
import { searchDirectoryController } from "@/features/chat/start/controllers/searchDirectory.controller";
import { startDirectConversation } from "@/features/chat/start/controllers/startDirectConversation.controller";
import { openConversation } from "@/features/chat/start/dal/rpc/openConversation.rpc";
import { sendMessageController } from "@/features/chat/conversation/controllers/sendMessage.controller";
import { markConversationSpam } from "@/features/chat/conversation/controllers/markConversationSpam.controller";
import { ctrlGetInboxEntries } from "@/features/chat/inbox/controllers/getInboxEntries.controller";
import { ctrlGetInboxEntryForConversation } from "@/features/chat/inbox/controllers/getInboxEntryForConversation.controller";
import { ctrlMoveConversationToFolder } from "@/features/chat/inbox/controllers/inboxActions.controller";
import {
  ctrlCreateTypingPresenceChannel,
  ctrlRemoveTypingPresenceChannel,
  ctrlTrackTypingPresence,
} from "@/features/chat/conversation/controllers/realtime/typingPresence.controller";

export const GROUP_ID = "chatFeature";
export const GROUP_LABEL = "Chat Feature";

const TEST_CATALOG = [
  { key: "feature_inventory", name: "chat feature file inventory" },
  { key: "feature_architecture", name: "chat feature architecture audit" },
  { key: "feature_entry_exports", name: "chat feature entry export surface" },
  { key: "seed_chat_context", name: "seed chat context via start flow" },
  { key: "search_directory", name: "search chat directory through controller" },
  { key: "inbox_read_smoke", name: "read inbox entries through inbox controller" },
  { key: "mark_spam_flow", name: "mark conversation spam flow" },
  { key: "typing_presence_flow", name: "typing presence channel lifecycle" },
];

function getState(shared) {
  if (!shared.cache.chatFeatureState) {
    shared.cache.chatFeatureState = {};
  }
  return shared.cache.chatFeatureState;
}

function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: { name: "ChatFeatureViolation", message },
  };
}

function isBlockedRelationshipError(error) {
  return String(error?.message ?? "").toLowerCase().includes("blocked relationship");
}

function isRealtimeUnavailable(error) {
  const text = String(error?.message ?? error?.details ?? "").toLowerCase();
  return text.includes("websocket") || text.includes("realtime") || text.includes("channel");
}

function toSkip(error, reason, extra = null) {
  if (
    isPermissionDenied(error) ||
    isMissingRpc(error) ||
    isSeedMissingError(error) ||
    isBlockedRelationshipError(error) ||
    isRealtimeUnavailable(error)
  ) {
    return makeSkipped(reason, { ...extra, error });
  }
  throw error;
}

function trimAudit(audit, maxItems = 30) {
  return {
    ...audit,
    issues: {
      ...audit.issues,
      oversizedFiles: audit.issues.oversizedFiles.slice(0, maxItems),
      depthViolations: audit.issues.depthViolations.slice(0, maxItems),
      relativeImports: audit.issues.relativeImports.slice(0, maxItems),
      crossFeatureImports: audit.issues.crossFeatureImports.slice(0, maxItems),
      namingViolations: audit.issues.namingViolations.slice(0, maxItems),
    },
  };
}

async function resolveTargetActor({ actorId, userId }) {
  const { data: ownedActors } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .neq("actor_id", actorId)
    .limit(5);

  const preferred = ownedActors?.[0]?.actor_id ?? null;
  if (preferred) {
    const { data: row } = await supabase
      .schema("vc")
      .from("actor_presentation")
      .select("actor_id,display_name,username")
      .eq("actor_id", preferred)
      .maybeSingle();
    return {
      actorId: preferred,
      displayName: row?.display_name ?? null,
      username: row?.username ?? null,
    };
  }

  const { data: rows, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id,display_name,username")
    .neq("actor_id", actorId)
    .limit(20);

  if (error) throw error;
  const row = rows?.[0] ?? null;
  return row
    ? { actorId: row.actor_id, displayName: row.display_name ?? null, username: row.username ?? null }
    : null;
}

async function ensureContext(shared) {
  const state = getState(shared);
  if (state.actorId && state.userId && state.targetActorId && state.conversationId) {
    return state;
  }

  const actorContext = await ensureActorContext(shared);
  const realmContext = await ensureRealm(shared);
  const target = await resolveTargetActor({ actorId: actorContext.actorId, userId: actorContext.userId });
  if (!target?.actorId) throw makeSkipped("No second actor visible for chat feature diagnostics.");

  const started = await startDirectConversation({
    fromActorId: actorContext.actorId,
    realmId: realmContext.realmId,
    picked: { actorId: target.actorId },
  });
  if (!started?.conversationId) throw new Error("Failed to start chat conversation for diagnostics.");

  await openConversation({ conversationId: started.conversationId, actorId: actorContext.actorId });
  const sent = await sendMessageController({
    conversationId: started.conversationId,
    actorId: actorContext.actorId,
    body: `Chat feature diagnostics ${Date.now()}`,
    messageType: "text",
  });

  state.actorId = actorContext.actorId;
  state.userId = actorContext.userId;
  state.targetActorId = target.actorId;
  state.targetDisplayName = target.displayName;
  state.targetUsername = target.username;
  state.conversationId = started.conversationId;
  state.messageId = sent?.message?.id ?? null;
  return state;
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

export function getChatFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runChatFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "chat feature file inventory",
      run: async () => {
        const entries = getFeatureSourceEntries().filter((entry) => entry.featureName === "chat");
        const byDomain = entries.reduce((acc, entry) => {
          const parts = entry.path.split("/");
          const domain = parts[3] ?? "(root)";
          acc[domain] = (acc[domain] ?? 0) + 1;
          return acc;
        }, {});
        return { fileCount: entries.length, byDomain };
      },
    },
    {
      id: buildTestId(GROUP_ID, "feature_architecture"),
      name: "chat feature architecture audit",
      run: async () => {
        const audit = trimAudit(auditFeature("chat"));
        if (audit.issueCount > 0) {
          return failWithData(`Chat feature has ${audit.issueCount} architecture issues`, audit);
        }
        return audit;
      },
    },
    {
      id: buildTestId(GROUP_ID, "feature_entry_exports"),
      name: "chat feature entry export surface",
      run: async () => ({
        hasInboxScreenExport: typeof ChatInboxScreen === "function",
        hasConversationScreenExport: typeof ChatConversationScreen === "function",
      }),
    },
    {
      id: buildTestId(GROUP_ID, "seed_chat_context"),
      name: "seed chat context via start flow",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Chat context bootstrap blocked by policy, RPC, or seed constraints.", async (context) => ({
          actorId: context.actorId,
          targetActorId: context.targetActorId,
          conversationId: context.conversationId,
        })),
    },
    {
      id: buildTestId(GROUP_ID, "search_directory"),
      name: "search chat directory through controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Chat directory search blocked by policy.", async (context) => {
          const query = String(context.targetUsername || context.targetDisplayName || "").slice(0, 6).trim();
          if (!query) return makeSkipped("No target username/display name available for search query.");
          const rows = await searchDirectoryController(query, { limitPerKind: 12 });
          return { query, count: rows.length, includesTarget: rows.some((row) => row.actorId === context.targetActorId) };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "inbox_read_smoke"),
      name: "read inbox entries through inbox controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Inbox read smoke test blocked by policy.", async (context) => {
          const rows = await ctrlGetInboxEntries({ actorId: context.actorId, folder: "inbox", includeArchived: false });
          return { count: rows.length, includesConversation: rows.some((row) => row.conversation_id === context.conversationId) };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "mark_spam_flow"),
      name: "mark conversation spam flow",
      run: ({ shared: localShared }) =>
        withContext(localShared, "markConversationSpam flow blocked by policy.", async (context) => {
          const reportId = await markConversationSpam({
            reporterActorId: context.actorId,
            conversationId: context.conversationId,
            reasonText: "Chat feature diagnostics spam flow",
          });
          const spamEntry = await ctrlGetInboxEntryForConversation({
            actorId: context.actorId,
            conversationId: context.conversationId,
          });
          await ctrlMoveConversationToFolder({
            actorId: context.actorId,
            conversationId: context.conversationId,
            folder: "inbox",
          });
          return { reportId: reportId ?? null, spamEntry };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "typing_presence_flow"),
      name: "typing presence channel lifecycle",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Typing presence lifecycle blocked or unavailable.", async (context) => {
          const channel = ctrlCreateTypingPresenceChannel({
            conversationId: context.conversationId,
            actorId: context.actorId,
          });
          if (!channel) throw new Error("Typing presence channel was not created.");
          try {
            await ctrlTrackTypingPresence({
              channel,
              actorPresentation: { actorId: context.actorId, ts: Date.now() },
            });
          } finally {
            ctrlRemoveTypingPresenceChannel(channel);
          }
          return { conversationId: context.conversationId, tracked: true };
        }),
    },
  ];

  return runDiagnosticsTests({ group: GROUP_ID, tests, onTestUpdate, shared });
}
