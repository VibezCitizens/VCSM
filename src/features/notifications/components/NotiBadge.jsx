// src/features/notifications/components/NotiBadge.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useNotiCount from '@/features/notifications/hooks/useNotiCount';
import { useIdentity } from '@/features/identity/identityContext'; // adjust import to your app
import BellIcon from '@/components/icons/BellIcon'; // replace with your icon

/**
 * NotiBadge
 *
 * Renders a bell with a badge for unseen notifications.
 * - Waits until identity.actorId is available.
 * - Forces scope='user' (we count on recipient_actor_id).
 * - Refreshes on route changes and when tab becomes visible.
 */
export default function NotiBadge({ className = '', debug = false }) {
  const { pathname } = useLocation();
  const { identity } = useIdentity(); // { type: 'user'|'vport', userId, actorId }
  const actorId = identity?.actorId ?? null;

  // Count (forces counting on recipient_actor_id)
  const count = useNotiCount({
    actorId,
    scope: 'user',
    debug,
    pollMs: 60_000,
  });

  // Refresh on route change (keeps badge fresh as you navigate)
  useEffect(() => {
    if (!actorId) return;
    if (debug) console.log('[NotiBadge] route change → refresh', { pathname, actorId });
    window.dispatchEvent(new Event('noti:refresh'));
  }, [pathname, actorId, debug]);

  // Don’t render a wrong state before identity is ready
  if (!actorId) {
    if (debug) console.log('[NotiBadge] identity.actorId not ready yet');
    return (
      <div className={`relative inline-flex items-center ${className}`} aria-label="Notifications">
        <BellIcon />
      </div>
    );
  }

  const showBadge = Number.isFinite(count) && count > 0;

  return (
    <div className={`relative inline-flex items-center ${className}`} aria-label="Notifications">
      <BellIcon />
      {showBadge && (
        <span
          className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 text-center"
          aria-label={`${count} new notifications`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}
