// src/features/profiles/hooks/useBlockStatus.js
import { useEffect, useState } from 'react';
import { isBlocking, isBlockedBy, getSessionActorId, getActorIdByAnyId } from '@/data/user/blocks/blocks';

/**
 * Hook to check whether the viewer and target profile are blocked
 * in either direction (actor-aware, supports users and vports).
 */
export function useBlockStatus(targetProfileId) {
  const [state, setState] = useState({
    loading: !!targetProfileId,
    isBlocking: false,
    isBlockedBy: false,
    anyBlock: false,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!targetProfileId) {
        if (alive) {
          setState({
            loading: false,
            isBlocking: false,
            isBlockedBy: false,
            anyBlock: false,
          });
        }
        return;
      }

      try {
        // Resolve actor IDs for both viewer and target
        const [viewerActorId, targetActorId] = await Promise.all([
          getSessionActorId(),
          getActorIdByAnyId(targetProfileId),
        ]);

        if (!viewerActorId || !targetActorId || viewerActorId === targetActorId) {
          if (alive) {
            setState({
              loading: false,
              isBlocking: false,
              isBlockedBy: false,
              anyBlock: false,
            });
          }
          return;
        }

        // Check both directions
        const [blocking, blockedBy] = await Promise.all([
          isBlocking(viewerActorId, targetActorId), // you → them
          isBlockedBy(viewerActorId, targetActorId), // them → you
        ]);

        if (alive) {
          setState({
            loading: false,
            isBlocking: blocking,
            isBlockedBy: blockedBy,
            anyBlock: blocking || blockedBy,
          });
        }
      } catch (err) {
        console.error('[useBlockStatus] failed:', err);
        if (alive) {
          setState({
            loading: false,
            isBlocking: false,
            isBlockedBy: false,
            anyBlock: false,
          });
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [targetProfileId]);

  return state;
}
