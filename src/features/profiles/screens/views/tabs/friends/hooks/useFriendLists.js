// ============================================================
//  FRIENDS SYSTEM — HOOK
// ------------------------------------------------------------
//  @File: useFriendLists.js
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Compute friend buckets from follow graph
//    • Actor-only (SSOT)
//    • Block-aware (NO LEAKS)
// ============================================================

import { useEffect, useState } from "react";

import { getFriendListsController } from "@/features/profiles/adapters/friends/topFriends.adapter";
import { hydrateActorsIntoStore } from "@/features/profiles/adapters/friends/topFriends.adapter";

/**
 * useFriendLists
 *
 * @param {string} actorId
 * @returns {{
 *   mutual: string[],
 *   iAmFan: string[],
 *   myFans: string[],
 *   loading: boolean
 * }}
 */
export function useFriendLists(actorId) {
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState({
    mutual: [],
    iAmFan: [],
    myFans: [],
  });

  useEffect(() => {
    if (!actorId) {
      setLists({ mutual: [], iAmFan: [], myFans: [] });
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        // ------------------------------------------------------------
        // 1. Compute filtered friend buckets
        // ------------------------------------------------------------
        const filtered = await getFriendListsController({ actorId });

        // ------------------------------------------------------------
        // 2. Hydrate ONLY safe actors
        // ------------------------------------------------------------
        await hydrateActorsIntoStore([
          ...filtered.mutual,
          ...filtered.iAmFan,
          ...filtered.myFans,
        ]);

        if (!cancelled) {
          setLists(filtered);
        }
      } catch (err) {
        console.error("[useFriendLists] failed:", err);
        if (!cancelled) {
          setLists({ mutual: [], iAmFan: [], myFans: [] });
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
  }, [actorId]);

  return {
    mutual: lists.mutual,
    iAmFan: lists.iAmFan,
    myFans: lists.myFans,
    loading,
  };
}
