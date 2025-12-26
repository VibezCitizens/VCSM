// ============================================================
//  BLOCK SYSTEM — CONTROLLER (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: blockActor.controller.js
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Enforce block / unblock business rules
//    • Orchestrate DAL + side effects
//    • Single source of business meaning
// ------------------------------------------------------------
//  RULES:
//   • actorId is the ONLY identity
//   • Controllers own permissions & intent
//   • DAL remains dumb and explicit
//   • No React, no hooks, no UI
// ============================================================

import {
  blockActor as blockActorDAL,
  unblockActor as unblockActorDAL,
} from "@/features/block/dal/block.write.dal";

import { checkBlockStatus } from "@/features/block/dal/block.check.dal";
import { applyBlockSideEffects } from "@/features/block/helpers/applyBlockSideEffects";

/* ============================================================
   BLOCK ACTOR — USE CASE
   ============================================================ */

/**
 * Block an actor (business-safe)
 *
 * Guarantees:
 *  • No self-blocking
 *  • Idempotent behavior
 *  • Side effects applied exactly once
 *
 * @param {string} blockerActorId
 * @param {string} blockedActorId
 *
 * @returns {{
 *   blocked: true
 * }}
 */
export async function blockActorController(
  blockerActorId,
  blockedActorId
) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("blockActorController: actorIds required");
  }

  if (blockerActorId === blockedActorId) {
    throw new Error("blockActorController: cannot block self");
  }

  // ----------------------------------------------------------
  // Check current relationship (business awareness)
  // ----------------------------------------------------------
  const { blockedByMe } = await checkBlockStatus(
    blockerActorId,
    blockedActorId
  );

  // ----------------------------------------------------------
  // Idempotent block
  // ----------------------------------------------------------
  if (!blockedByMe) {
    await blockActorDAL(blockerActorId, blockedActorId);
    await applyBlockSideEffects(blockerActorId, blockedActorId);
  }

  return { blocked: true };
}

/* ============================================================
   UNBLOCK ACTOR — USE CASE
   ============================================================ */

/**
 * Unblock an actor (business-safe)
 *
 * @param {string} blockerActorId
 * @param {string} blockedActorId
 *
 * @returns {{
 *   blocked: false
 * }}
 */
export async function unblockActorController(
  blockerActorId,
  blockedActorId
) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("unblockActorController: actorIds required");
  }

  await unblockActorDAL(blockerActorId, blockedActorId);

  return { blocked: false };
}

/* ============================================================
   TOGGLE BLOCK — USE CASE
   ============================================================ */

/**
 * Toggle block state with full business guarantees
 *
 * @param {string} blockerActorId
 * @param {string} blockedActorId
 *
 * @returns {{
 *   blocked: boolean
 * }}
 */
export async function toggleBlockActorController(
  blockerActorId,
  blockedActorId
) {
  if (!blockerActorId || !blockedActorId) {
    throw new Error("toggleBlockActorController: actorIds required");
  }

  const { blockedByMe } = await checkBlockStatus(
    blockerActorId,
    blockedActorId
  );

  if (blockedByMe) {
    await unblockActorDAL(blockerActorId, blockedActorId);
    return { blocked: false };
  }

  await blockActorDAL(blockerActorId, blockedActorId);
  await applyBlockSideEffects(blockerActorId, blockedActorId);

  return { blocked: true };
}
