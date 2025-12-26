// ============================================================
//  BLOCK SYSTEM — STATUS HOOK (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: useBlockStatus.js
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
// ============================================================

import { useEffect, useState } from "react";
import { checkBlockStatus } from "@/features/block/dal/block.check.dal";

/**
 * useBlockStatus
 *
 * @param {string} myActorId
 * @param {string} targetActorId
 *
 * @returns {{
 *   loading: boolean,
 *   isBlocked: boolean,      // I blocked them OR either side blocked
 *   blockedMe: boolean,      // They blocked me
 *   canViewProfile: boolean,
 *   canInteract: boolean
 * }}
 */
export function useBlockStatus(myActorId, targetActorId) {
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);

  useEffect(() => {
    if (!myActorId || !targetActorId || myActorId === targetActorId) {
      setIsBlocked(false);
      setBlockedMe(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        const result = await checkBlockStatus(myActorId, targetActorId);

        if (!cancelled) {
          setIsBlocked(result.isBlocked);
          setBlockedMe(result.blockedMe);
        }
      } catch (err) {
        console.error("[useBlockStatus] failed:", err);
        if (!cancelled) {
          setIsBlocked(false);
          setBlockedMe(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [myActorId, targetActorId]);

  /* ============================================================
     DERIVED GUARDS
     ============================================================ */

  const canViewProfile = !isBlocked && !blockedMe;
  const canInteract   = !isBlocked && !blockedMe;

  return {
    loading,
    isBlocked,
    blockedMe,
    canViewProfile,
    canInteract,
  };
}
