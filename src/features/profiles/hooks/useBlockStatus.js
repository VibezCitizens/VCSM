// src/features/profiles/hooks/useBlockStatus.js
import { useEffect, useState } from 'react';
import { isBlocking, isBlockedBy } from '@/data/user/blocks/blocks';

import { useAuth } from '@/hooks/useAuth';

export function useBlockStatus(targetProfileId) {
  const { user } = useAuth();
  const viewerId = user?.id || null;

  const [state, setState] = useState({
    loading: !!targetProfileId,
    isBlocking: false,
    isBlockedBy: false,
    anyBlock: false,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!targetProfileId || !viewerId || targetProfileId === viewerId) {
        if (alive) setState({ loading: false, isBlocking: false, isBlockedBy: false, anyBlock: false });
        return;
      }
      try {
        const [a, b] = await Promise.all([
          isBlocking(viewerId, targetProfileId),
          isBlockedBy(viewerId, targetProfileId),
        ]);
        if (alive) setState({ loading: false, isBlocking: a, isBlockedBy: b, anyBlock: a || b });
      } catch {
        if (alive) setState({ loading: false, isBlocking: false, isBlockedBy: false, anyBlock: false });
      }
    })();
    return () => { alive = false; };
  }, [viewerId, targetProfileId]);

  return state;
}
