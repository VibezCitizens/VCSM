// src/features/wanders/core/hooks/useWandersMailbox.hook.js
// ============================================================================
// WANDERS CORE HOOK — MAILBOX
// Contract: UI lifecycle only. Calls core controller. No DAL directly.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";
import {
  listMailboxForViewer,
  markMailboxItemRead,
} from "@/features/wanders/core/controllers/mailbox.controller";

export default function useWandersMailbox(input = {}) {
  const { auto = true, folder = "inbox", ownerRole = null, limit = 50 } = input;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(auto));
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(
    async (override = {}) => {
      setLoading(true);
      setError(null);

      try {
        await ensureGuestUser();

        const res = await listMailboxForViewer({
          folder: override.folder ?? folder,
          ownerRole: override.ownerRole ?? ownerRole,
          limit: override.limit ?? limit,
        });

        if (!mountedRef.current) return [];
        const next = res ?? [];
        setItems(next);
        return next;
      } catch (e) {
        if (!mountedRef.current) return [];
        setError(e);
        return [];
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [folder, ownerRole, limit]
  );

  useEffect(() => {
    if (!auto) return;
    refresh();
  }, [auto, refresh]);

  const markRead = useCallback(async (itemId, isRead = true) => {
    setError(null);
    const updated = await markMailboxItemRead({ itemId, isRead });
    setItems((prev) => (prev ?? []).map((it) => (String(it.id) === String(itemId) ? updated : it)));
    return updated;
  }, []);

  return { items, loading, error, refresh, markRead };
}

export { useWandersMailbox };
