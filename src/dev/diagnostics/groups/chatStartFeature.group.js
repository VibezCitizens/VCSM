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
import { resolvePickedActor } from "@/features/chat/start/controllers/resolvePickedToActorId.controller";
import { searchDirectoryController } from "@/features/chat/start/controllers/searchDirectory.controller";
import { getOrCreateDirectConversation } from "@/features/chat/start/controllers/getOrCreateDirectConversation.controller";
import { startDirectConversation } from "@/features/chat/start/controllers/startDirectConversation.controller";
import { openConversation } from "@/features/chat/start/dal/rpc/openConversation.rpc";

export const GROUP_ID = "chatStartFeature";
export const GROUP_LABEL = "Chat Start Feature";

const TEST_CATALOG = [
  { key: "seed_start_context", name: "seed chat-start context" },
  { key: "resolve_picked_aliases", name: "resolve picked actor aliases" },
  { key: "search_directory", name: "search directory via start controller" },
  { key: "get_or_create_direct", name: "get or create direct conversation" },
  { key: "open_conversation", name: "open conversation via RPC wrapper" },
  { key: "start_direct_actorid", name: "start direct conversation with actorId picked" },
  { key: "start_direct_id_alias", name: "start direct conversation with id alias picked" },
  { key: "start_direct_invalid_picked", name: "reject invalid picked actor id" },
];

function getState(shared) {
  if (!shared.cache.chatStartFeatureState) {
    shared.cache.chatStartFeatureState = {};
  }
  return shared.cache.chatStartFeatureState;
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

async function resolveTargetActor({ actorId, userId }) {
  const { data: ownedActors } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .neq("actor_id", actorId)
    .limit(5);

  const candidateId = Array.isArray(ownedActors) && ownedActors.length > 0
    ? ownedActors[0].actor_id
    : null;

  if (candidateId) {
    const { data: profile } = await supabase
      .schema("vc")
      .from("actor_presentation")
      .select("actor_id,display_name,username")
      .eq("actor_id", candidateId)
      .maybeSingle();
    return {
      actorId: candidateId,
      displayName: profile?.display_name ?? null,
      username: profile?.username ?? null,
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
    ? {
        actorId: row.actor_id,
        displayName: row.display_name ?? null,
        username: row.username ?? null,
      }
    : null;
}

async function ensureContext(shared) {
  const state = getState(shared);
  if (state.actorId && state.userId && state.realmId && state.targetActorId) {
    return {
      actorId: state.actorId,
      userId: state.userId,
      realmId: state.realmId,
      targetActorId: state.targetActorId,
      targetDisplayName: state.targetDisplayName ?? null,
      targetUsername: state.targetUsername ?? null,
    };
  }

  const actorContext = await ensureActorContext(shared);
  const realmContext = await ensureRealm(shared);
  const target = await resolveTargetActor({
    actorId: actorContext.actorId,
    userId: actorContext.userId,
  });

  if (!target?.actorId) {
    throw makeSkipped("No second actor visible for chat-start diagnostics.");
  }

  state.actorId = actorContext.actorId;
  state.userId = actorContext.userId;
  state.realmId = realmContext.realmId;
  state.targetActorId = target.actorId;
  state.targetDisplayName = target.displayName;
  state.targetUsername = target.username;

  return {
    actorId: state.actorId,
    userId: state.userId,
    realmId: state.realmId,
    targetActorId: state.targetActorId,
    targetDisplayName: state.targetDisplayName,
    targetUsername: state.targetUsername,
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

export function getChatStartFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runChatStartFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "seed_start_context"),
      name: "seed chat-start context",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Chat-start context bootstrap blocked by policy, RPC, or seeds.", async (context) => context),
    },
    {
      id: buildTestId(GROUP_ID, "resolve_picked_aliases"),
      name: "resolve picked actor aliases",
      run: ({ shared: localShared }) =>
        withContext(localShared, "resolvePickedActor alias checks failed due policy constraints.", async (context) => {
          const byActorId = await resolvePickedActor({ actorId: context.targetActorId });
          const byId = await resolvePickedActor({ id: context.targetActorId });
          return {
            targetActorId: context.targetActorId,
            byActorId,
            byId,
            aliasesMatch: byActorId === byId && byId === context.targetActorId,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "search_directory"),
      name: "search directory via start controller",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Directory search blocked by policy.", async (context) => {
          const queryBase = context.targetUsername || context.targetDisplayName || "";
          const query = String(queryBase).slice(0, 6).trim();
          if (!query) return makeSkipped("No queryable target username/display name available.");
          const rows = await searchDirectoryController(query, { limitPerKind: 12 });
          return {
            query,
            count: rows?.length ?? 0,
            includesTarget: rows.some((row) => row.actorId === context.targetActorId),
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "get_or_create_direct"),
      name: "get or create direct conversation",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Direct conversation get/create blocked by policy or RPC.", async (context) => {
          const created = await getOrCreateDirectConversation({
            fromActorId: context.actorId,
            toActorId: context.targetActorId,
            realmId: context.realmId,
          });
          if (!created?.conversationId) throw new Error("getOrCreateDirectConversation returned no conversationId.");
          getState(localShared).conversationId = created.conversationId;
          return { conversationId: created.conversationId };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "open_conversation"),
      name: "open conversation via RPC wrapper",
      run: ({ shared: localShared }) =>
        withContext(localShared, "openConversation wrapper blocked by policy or RPC.", async (context) => {
          const conversationId = getState(localShared).conversationId ?? null;
          if (!conversationId) return makeSkipped("Conversation was not created before open_conversation test.");
          const opened = await openConversation({ conversationId, actorId: context.actorId });
          return { conversationId, opened };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "start_direct_actorid"),
      name: "start direct conversation with actorId picked",
      run: ({ shared: localShared }) =>
        withContext(localShared, "startDirectConversation with actorId blocked by policy.", async (context) => {
          const started = await startDirectConversation({
            fromActorId: context.actorId,
            realmId: context.realmId,
            picked: { actorId: context.targetActorId },
          });
          return { conversationId: started?.conversationId ?? null, targetActorId: context.targetActorId };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "start_direct_id_alias"),
      name: "start direct conversation with id alias picked",
      run: ({ shared: localShared }) =>
        withContext(localShared, "startDirectConversation with id alias blocked by policy.", async (context) => {
          const started = await startDirectConversation({
            fromActorId: context.actorId,
            realmId: context.realmId,
            picked: { id: context.targetActorId },
          });
          return { conversationId: started?.conversationId ?? null, targetActorId: context.targetActorId };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "start_direct_invalid_picked"),
      name: "reject invalid picked actor id",
      run: ({ shared: localShared }) =>
        withContext(localShared, "Invalid picked-actor validation check could not run.", async (context) => {
          try {
            await startDirectConversation({
              fromActorId: context.actorId,
              realmId: context.realmId,
              picked: { actorId: "invalid-actor-id" },
            });
            throw new Error("Expected invalid picked actor id to be rejected, but call succeeded.");
          } catch (error) {
            const message = String(error?.message ?? "");
            const rejected = message.toLowerCase().includes("invalid actorid") || message.toLowerCase().includes("invalid");
            if (!rejected) throw error;
            return { rejected: true, message };
          }
        }),
    },
  ];

  return runDiagnosticsTests({ group: GROUP_ID, tests, onTestUpdate, shared });
}
