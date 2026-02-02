/**
 * startDirectConversation
 * ============================================================
 * CHAT START → DIRECT CONVERSATION BRIDGE
 * Location:
 *   src/features/chat/start/controllers/startDirectConversation.controller.js
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * This controller is the **single orchestration point** for
 * starting or opening a **direct (1-to-1) conversation**
 * from outside the core chat runtime.
 *
 * It belongs to the **chat/start** domain because it represents
 * an ENTRY ACTION into chat, not an in-chat operation.
 *
 *
 * WHO SHOULD CALL THIS
 * ------------------------------------------------------------
 * - Profile "Message" buttons
 * - Vport pages
 * - Search / directory results
 * - Notifications
 * - Any feature that wants to ENTER chat
 *
 * These callers are OUTSIDE the chat conversation runtime.
 *
 *
 * WHAT THIS CONTROLLER DOES
 * ------------------------------------------------------------
 * Given:
 *   - fromActorId (initiating actor)
 *   - realmId (chat realm)
 *   - picked (UI selection describing the target)
 *
 * It guarantees:
 *   1. The picked target is resolved to a valid actor_id
 *   2. A direct conversation exists (created or reused)
 *   3. The conversation is opened for the initiating actor
 *      (inbox entry / visibility / read model sync)
 *
 * The caller receives a conversationId that is:
 *   - valid
 *   - actor-accessible
 *   - ready for navigation
 *
 *
 * WHAT THIS CONTROLLER HIDES
 * ------------------------------------------------------------
 * Callers MUST NOT:
 * - Resolve actor IDs themselves
 * - Call Supabase
 * - Call RPCs
 * - Know about vc.conversations or vc.conversation_members
 * - Manage inbox or visibility state
 *
 * All of that is INTERNAL to chat/start.
 *
 *
 * ARCHITECTURAL POSITION
 * ------------------------------------------------------------
 * Feature / UI
 *     ↓
 * chat/start/controllers/startDirectConversation
 *     ↓
 * chat/start/*
 *     ↓
 * chat/conversation/*
 *
 * This file is a **boundary controller**, not a DAL,
 * not a hook, and not UI logic.
 *
 *
 * EXTENSION POINT (INTENTIONAL)
 * ------------------------------------------------------------
 * This is the correct place to add:
 * - block / mute enforcement
 * - privacy or follow-only rules
 * - rate limiting
 * - audit logging
 * - analytics
 *
 * WITHOUT touching UI or chat runtime code.
 *
 *
/**
 * startDirectConversation
 * ============================================================
 * CHAT START → DIRECT CONVERSATION BRIDGE
 * Location:
 *   src/features/chat/start/controllers/startDirectConversation.controller.js
 * ============================================================
 * ... (your existing header unchanged)
 * ============================================================
 */// src/features/chat/controllers/startDirectConversation.controller.js

// src/features/chat/start/controllers/startDirectConversation.controller.js

import { resolvePickedActor } from
  '@/features/chat/start/controllers/resolvePickedToActorId.controller'

import { getOrCreateDirectConversation } from '@/features/chat/start/controllers/getOrCreateDirectConversation.controller'
import { openConversation } from '@/features/chat/start/dal/rpc/openConversation.rpc'

// ✅ BLOCK CHECK (global)
import { checkBlockStatus } from '@/features/block/dal/block.check.dal'

export async function startDirectConversation({
  fromActorId,
  realmId,
  picked,
}) {
  if (!fromActorId) throw new Error('Missing fromActorId')
  if (!realmId) throw new Error('Missing realmId')
  if (!picked) throw new Error('Missing picked')

  // 🔒 INVARIANT GUARD — boundary protection
  if (picked.actorId && picked.actorId.length !== 36) {
    throw new Error(
      '[chat/start] Invalid actorId passed into chat boundary'
    )
  }

  // 1️⃣ Resolve target actor
  const toActorId = await resolvePickedActor(picked)
  if (!toActorId) throw new Error('Failed to resolve target actor')

  // ✅ BLOCK ENFORCEMENT (GLOBAL)
  const { isBlocked } = await checkBlockStatus(fromActorId, toActorId)
  if (isBlocked) {
    throw new Error('[chat/start] blocked relationship — cannot start conversation')
  }

  // 2️⃣ Create or fetch conversation
  const { conversationId } = await getOrCreateDirectConversation({
    fromActorId,
    toActorId,
    realmId,
  })

  // 3️⃣ Ensure inbox entry / open
  await openConversation({
    conversationId,
    actorId: fromActorId,
  })

  return { conversationId }
}
