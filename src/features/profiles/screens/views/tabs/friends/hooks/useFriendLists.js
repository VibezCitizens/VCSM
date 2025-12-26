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

import { fetchFollowGraph } from "../dal/friends.read.dal";
import { deriveFriendLists } from "../dal/friendGraph.utils";
import { hydrateActorsIntoStore } from "../helpers/hydrateActorsIntoStore";

// 🔒 BLOCK READ GATE
import { filterBlockedActors } from "@/features/block/dal/block.read.dal";

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
        // 1. Load follow graph
        // ------------------------------------------------------------
        const graph = await fetchFollowGraph(actorId);

        // ------------------------------------------------------------
        // 2. Derive friend buckets (PURE)
        // ------------------------------------------------------------
        const derived = deriveFriendLists(graph);

        // ------------------------------------------------------------
        // 3. Block filter (BIDIRECTIONAL)
        // ------------------------------------------------------------
        const allCandidateIds = [
          ...derived.mutual,
          ...derived.iAmFan,
          ...derived.myFans,
        ];

        const blockedSet = await filterBlockedActors(
          actorId,
          allCandidateIds
        );

        const filtered = {
          mutual: derived.mutual.filter(
            (id) => !blockedSet.has(id)
          ),
          iAmFan: derived.iAmFan.filter(
            (id) => !blockedSet.has(id)
          ),
          myFans: derived.myFans.filter(
            (id) => !blockedSet.has(id)
          ),
        };

        // ------------------------------------------------------------
        // 4. Hydrate ONLY safe actors
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
