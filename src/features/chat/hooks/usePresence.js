// src/features/chat/hooks/usePresence.js
import { useEffect, useRef } from 'react';
import { users as usersDAL } from '@/data/profiles';

/**
 * usePresence (no realtime)
 * - Only one "leader" tab performs pings (localStorage election).
 * - Pings only when the document is visible.
 * - Jittered interval to avoid synchronized writes.
 * - Best-effort pagehide ping on leave/unmount.
 *
 * @param {{id?: string}|null} user
 * @param {number} intervalMs  Base interval (default 60s). A ±20% jitter is applied.
 */
export function usePresence(user, intervalMs = 60000) {
  const pingTimerRef = useRef(null);
  const hbTimerRef = useRef(null);
  const isLeaderRef = useRef(false);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    const KEY = 'presence_leader_v1';
    const HEARTBEAT_MS = 2000; // leader heartbeat cadence
    const EXPIRE_MS = 7000;    // leadership considered stale after this

    const now = () => Date.now();

    const readLeader = () => {
      try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const writeLeader = (obj) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(obj));
      } catch {
        /* ignore */
      }
    };

    const clearTimers = () => {
      if (pingTimerRef.current) {
        clearTimeout(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      if (hbTimerRef.current) {
        clearInterval(hbTimerRef.current);
        hbTimerRef.current = null;
      }
    };

    const jitteredDelay = () => {
      const jitterPct = 0.2; // ±20%
      const delta = intervalMs * jitterPct;
      const min = Math.max(5000, intervalMs - delta);
      const max = intervalMs + delta;
      return Math.floor(min + Math.random() * (max - min));
    };

    const ping = async () => {
      try {
        if (document.visibilityState === 'visible') {
          await usersDAL.touchLastSeen();
        }
      } catch {
        // best-effort; ignore failures
      }
    };

    const schedulePingLoop = () => {
      if (!isLeaderRef.current) return;
      if (pingTimerRef.current) clearTimeout(pingTimerRef.current);

      const loop = async () => {
        if (!isLeaderRef.current) return;
        if (document.visibilityState === 'visible') {
          await usersDAL.touchLastSeen();
        }
        pingTimerRef.current = setTimeout(loop, jitteredDelay());
      };

      // start with a small random offset to de-sync initial waves
      pingTimerRef.current = setTimeout(loop, Math.floor(Math.random() * 1000));
    };

    const tryBecomeLeader = () => {
      const cur = readLeader();
      const t = now();
      if (!cur || (t - (cur.ts || 0)) > EXPIRE_MS) {
        isLeaderRef.current = true;
        writeLeader({ uid: user.id, ts: t });
        return true;
      }
      return false;
    };

    const renewLeadership = () => {
      if (!isLeaderRef.current) return;
      writeLeader({ uid: user.id, ts: now() });
    };

    const maybeRelinquish = () => {
      // If another tab wrote a fresh heartbeat, step down.
      const cur = readLeader();
      const t = now();
      if (cur && cur.uid !== user.id && (t - (cur.ts || 0)) <= EXPIRE_MS) {
        isLeaderRef.current = false;
        clearTimers();
      }
    };

    const onStorage = (e) => {
      if (e.key !== KEY) return;
      maybeRelinquish();
      if (!isLeaderRef.current) {
        // Leadership might be free; attempt to acquire.
        tryBecomeLeader();
        if (isLeaderRef.current) {
          renewLeadership();
          schedulePingLoop();
        }
      }
    };

    const onVisibilityChange = () => {
      if (!isLeaderRef.current) return;
      // On becoming visible, nudge a ping soon.
      if (document.visibilityState === 'visible') {
        // quick best-effort ping; loop continues on its own
        usersDAL.touchLastSeen().catch(() => {});
      }
    };

    const onPageHide = () => {
      // best-effort ping when leaving
      usersDAL.touchLastSeen().catch(() => {});
    };

    // ---- start
    stoppedRef.current = false;

    // race to become leader
    tryBecomeLeader();
    if (isLeaderRef.current) {
      renewLeadership();
      schedulePingLoop();
    }

    // leader heartbeat refresher
    hbTimerRef.current = setInterval(() => {
      const cur = readLeader();
      const t = now();

      if (isLeaderRef.current) {
        // if someone else is fresh leader, step down
        if (cur && cur.uid !== user.id && (t - (cur.ts || 0)) <= EXPIRE_MS) {
          isLeaderRef.current = false;
          clearTimers();
          return;
        }
        // keep our heartbeat fresh
        renewLeadership();
      } else {
        // non-leader: attempt to seize leadership if stale
        if (!cur || (t - (cur.ts || 0)) > EXPIRE_MS) {
          if (tryBecomeLeader()) {
            renewLeadership();
            schedulePingLoop();
          }
        }
      }
    }, HEARTBEAT_MS);

    // initial best-effort ping
    usersDAL.touchLastSeen().catch(() => {});

    // listeners
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      stoppedRef.current = true;
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      clearTimers();
      // final best-effort ping
      usersDAL.touchLastSeen().catch(() => {});
    };
  }, [user?.id, intervalMs]);
}
