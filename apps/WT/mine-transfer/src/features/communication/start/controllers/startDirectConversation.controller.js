import { getOrCreateDirectConversation } from "@/features/chat/start/controllers/getOrCreateDirectConversation.controller";
import { resolvePickedActor } from "@/features/chat/start/controllers/resolvePickedToActorId.controller";
import { readActorRealmContextDAL } from "@/features/chat/start/dal/read/actorRealm.read.dal";
import { listUserBlockRowsBetweenActorsDAL } from "@/features/chat/start/dal/read/blockRelations.read.dal";
import { openConversation } from "@/features/chat/start/dal/rpc/openConversation.rpc";
import { resolveRealm } from "@/shared/utils/resolveRealm";

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

async function resolveChatRealmId({ fromActorId, realmId }) {
  if (isUuid(realmId)) return realmId;

  try {
    const actor = await readActorRealmContextDAL({ actorId: fromActorId });
    if (actor) {
      return resolveRealm(Boolean(actor.is_void));
    }
  } catch {
    // Fallback below.
  }

  return resolveRealm(false);
}

export async function startDirectConversation({
  fromActorId,
  realmId,
  picked,
}) {
  if (!fromActorId) throw new Error("Missing fromActorId");
  if (!picked) throw new Error("Missing picked");

  if (picked.actorId && picked.actorId.length !== 36) {
    throw new Error("[chat/start] Invalid actorId passed into chat boundary");
  }

  const toActorId = await resolvePickedActor(picked);
  if (!toActorId) throw new Error("Failed to resolve target actor");
  if (!isUuid(toActorId)) {
    throw new Error("[chat/start] target actor id is invalid");
  }

  const effectiveRealmId = await resolveChatRealmId({ fromActorId, realmId });

  const isBlocked =
    (await listUserBlockRowsBetweenActorsDAL({
      actorA: fromActorId,
      actorB: toActorId,
    })).length > 0;
  if (isBlocked) {
    throw new Error("[chat/start] blocked relationship - cannot start conversation");
  }

  const { conversationId } = await getOrCreateDirectConversation({
    fromActorId,
    toActorId,
    realmId: effectiveRealmId,
  });

  await openConversation({
    conversationId,
    actorId: fromActorId,
  });

  return { conversationId };
}
