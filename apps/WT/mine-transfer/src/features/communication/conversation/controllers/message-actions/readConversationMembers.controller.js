// src/features/chat/conversation/controllers/message-actions/readConversationMembers.controller.js

import { getActorSummariesByIdsDAL } from "@/features/actors/dal/getActorSummariesByIds.dal";
import {
  collectConversationMemberActorIdsNeedingFallback,
  hydrateConversationMemberRows,
} from "@/features/chat/conversation/lib/memberActorPresentation";
import { ConversationMemberModel } from "@/features/chat/conversation/model/ConversationMember.model";
import {
  getConversationMemberDAL,
  getConversationMembersDAL,
} from "@/features/chat/conversation/dal/read/members.read.dal";

async function hydrateMemberActors(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return list;

  const actorIds = collectConversationMemberActorIdsNeedingFallback(list);
  if (!actorIds.length) return list;

  const { rows: summaryRows, error } = await getActorSummariesByIdsDAL({
    actorIds,
  });

  if (error || !summaryRows?.length) return list;
  return hydrateConversationMemberRows(list, summaryRows);
}

export async function readConversationMembersController({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error("[readConversationMembersController] missing params");
  }

  const [membersRaw, meRaw] = await Promise.all([
    getConversationMembersDAL({ conversationId }),
    getConversationMemberDAL({ conversationId, actorId }),
  ]);

  const [membersHydrated, meHydrated] = await Promise.all([
    hydrateMemberActors(membersRaw ?? []),
    hydrateMemberActors(meRaw ? [meRaw] : []),
  ]);

  return {
    members: (membersHydrated ?? [])
      .map(ConversationMemberModel)
      .filter(Boolean),
    me: meHydrated?.[0] ? ConversationMemberModel(meHydrated[0]) : null,
  };
}
