// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\postcard\hooks\usePostCovers.js

import { useCallback, useEffect, useMemo, useState } from "react";
import { getHiddenPostIdsForActor } from "@/features/moderation/controllers/postVisibility.controller";

/**
 * postIds: string[]
 *
 * Returns:
 * - coveredIds: Set<string>
 * - refresh: () => Promise<void>
 */
export default function usePostCovers({ actorId, postIds }) {
  const [coveredIdsServer, setCoveredIdsServer] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  const ids = useMemo(() => {
    return Array.isArray(postIds) ? postIds.filter(Boolean) : [];
  }, [postIds]);

  const refresh = useCallback(async () => {
    if (!actorId || ids.length === 0) {
      setCoveredIdsServer(new Set());
      return;
    }

    setLoading(true);
    try {
      const serverSet = await getHiddenPostIdsForActor({
        actorId,
        postIds: ids,
      });
      setCoveredIdsServer(serverSet);
    } finally {
      setLoading(false);
    }
  }, [actorId, ids]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    coveredIds: coveredIdsServer,
    coveredIdsServer,
    loading,
    refresh,
  };
}
