// ============================================================
//  BLOCK SYSTEM — ACTIONS HOOK (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: useBlockActions.js
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Block / unblock actions
//    • Apply social graph side-effects
// ------------------------------------------------------------
//  RULES:
//   • ActorId is the ONLY identity
//   • UI-safe hook
//   • DB logic lives in DAL
//   • Side-effects delegated to helpers
//   • NO Supabase imports
// ============================================================

import { useState, useCallback } from "react";

import {
  blockActor,
  unblockActor,
} from "@/features/block/dal/block.write.dal";

import { applyBlockSideEffects } from "@/features/block/helpers/applyBlockSideEffects";

/**
 * useBlockActions
 *
 * @param {string} myActorId        actor performing the action
 * @param {string} targetActorId   actor being blocked/unblocked
 */
export function useBlockActions(myActorId, targetActorId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ============================================================
     BLOCK
     ============================================================ */
  const block = useCallback(async () => {
    if (!myActorId || !targetActorId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Write block row (idempotent)
      await blockActor(myActorId, targetActorId);

      // 2. Enforce side effects (follows, ranks, etc.)
      await applyBlockSideEffects(myActorId, targetActorId);
    } catch (err) {
      console.error("[useBlockActions] block failed:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [myActorId, targetActorId]);

  /* ============================================================
     UNBLOCK
     ============================================================ */
  const unblock = useCallback(async () => {
    if (!myActorId || !targetActorId) return;

    setLoading(true);
    setError(null);

    try {
      await unblockActor(myActorId, targetActorId);
    } catch (err) {
      console.error("[useBlockActions] unblock failed:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [myActorId, targetActorId]);

  return {
    block,
    unblock,
    loading,
    working: loading, // ✅ alias for UI consistency
    error,
  };
}
