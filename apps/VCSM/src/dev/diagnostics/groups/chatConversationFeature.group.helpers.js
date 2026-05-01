import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureRealm } from "@/dev/diagnostics/helpers/ensureRealm";
import {
  isMissingRpc,
  isPermissionDenied,
  isSeedMissingError,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

const GROUP_ID = "chatConversationFeature";

export const TEST_CATALOG = [
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

export function getChatConversationFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export function getChatConversationFeatureState(shared) {
  if (!shared.cache.chatConversationFeatureState) {
    shared.cache.chatConversationFeatureState = {};
  }
  return shared.cache.chatConversationFeatureState;
}

export function conversationIdFromState(shared) {
  return getChatConversationFeatureState(shared).conversationId ?? null;
}

export function sendBody(prefix) {
  return `${prefix} ${Date.now()}`;
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
    .schema("identity")
    .from("actor_directory")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(20);

  if (error) throw error;
  return rows?.[0]?.actor_id ?? null;
}

async function ensureChatConversationContext(shared) {
  const state = getChatConversationFeatureState(shared);
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

export async function withChatConversationContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureChatConversationContext(localShared);
    return await run(context);
  } catch (error) {
    return toSkip(error, reason, { context });
  }
}
