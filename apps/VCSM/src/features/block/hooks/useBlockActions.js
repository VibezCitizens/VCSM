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
  blockActorController,
  unblockActorController,
} from "@/features/block/controllers/blockActor.controller";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { invalidateFeedBlockCache } from "@/features/feed/adapters/feedCache.adapter";

/**
 * useBlockActions
 *
 * @param {string} myActorId        actor performing the action
 * @param {string} targetActorId   actor being blocked/unblocked
 */
export function useBlockActions(myActorId, targetActorId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { identity } = useIdentity();
  const sessionActorId = identity?.actorId ?? null;

  /* ============================================================
     BLOCK
     ============================================================ */
  const block = useCallback(async () => {
    if (!myActorId || !targetActorId) return;

    setLoading(true);
    setError(null);

    try {
      await blockActorController(myActorId, targetActorId, sessionActorId);
      invalidateFeedBlockCache(myActorId);
    } catch (err) {
      console.error("[useBlockActions] block failed:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [myActorId, targetActorId, sessionActorId]);

  /* ============================================================
     UNBLOCK
     ============================================================ */
  const unblock = useCallback(async () => {
    if (!myActorId || !targetActorId) return;

    setLoading(true);
    setError(null);

    try {
      await unblockActorController(myActorId, targetActorId, sessionActorId);
      invalidateFeedBlockCache(myActorId);
    } catch (err) {
      console.error("[useBlockActions] unblock failed:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [myActorId, targetActorId, sessionActorId]);

  return {
    block,
    unblock,
    loading,
    working: loading, // ✅ alias for UI consistency
    error,
  };
}
