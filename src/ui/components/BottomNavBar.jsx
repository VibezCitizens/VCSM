// src/ui/components/BottomNavBar.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, User, Compass, MessageCircle, Bell, Settings } from 'lucide-react';
import { useIdentity } from '@/state/identityContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useVportNotifications } from '@/hooks/useVportNotifications';
import useUnreadMessageTotal from '@/hooks/useUnreadMessageTotal';

import { db } from '@/data/data';

export default function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity } = useIdentity();

  const userId = identity?.userId ?? null;

  // Counts
  const msgUnread = useUnreadMessageTotal(userId, { intervalMs: 30000 });

  // IMPORTANT: grab reloaders so we can drop the badge immediately after clearing
  const {
    unread: userUnread = 0,
    reload: reloadUserNotis,
  } = useNotifications(userId);

  // If you still surface a separate VPORT feed, keep this; otherwise you can delete it.
  const {
    unread: vportUnread = 0,
    reload: reloadVportNotis,
  } = useVportNotifications(userId, 50);

  // Local optimistic hide
  const [hideMsgBadge, setHideMsgBadge] = useState(false);
  const [hideNotifBadge, setHideNotifBadge] = useState(false);

  // Reset hides when the backend truly reaches 0
  useEffect(() => { if (msgUnread === 0) setHideMsgBadge(false); }, [msgUnread]);
  useEffect(() => {
    const n = identity?.type === 'vport' ? vportUnread : userUnread;
    if (n === 0) setHideNotifBadge(false);
  }, [identity?.type, userUnread, vportUnread]);

  // Destinations
  const profileHref =
    identity?.type === 'vport' && identity?.vportId ? `/vport/${identity.vportId}` : '/me';
  const chatHref =
    identity?.type === 'vport' && identity?.vportId ? '/vchat' : '/chat';
  const notificationsHref =
    identity?.type === 'vport' ? '/vnotifications' : '/notifications';

  // Active states
  const isProfileActive =
    location.pathname.startsWith('/me') ||
    location.pathname.startsWith('/u/') ||
    location.pathname.startsWith('/profile/') ||
    location.pathname.startsWith('/vport/') ||
    location.pathname.startsWith('/v/') ||
    location.pathname.startsWith('/vp/');

  const isChatActive =
    location.pathname.startsWith('/chat') ||
    location.pathname.startsWith('/vchat');

  const isNotificationsActive =
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/noti/') ||
    location.pathname.startsWith('/vnotifications') ||
    location.pathname.startsWith('/vnoti/');

  const rawNotifCount = identity?.type === 'vport' ? vportUnread : userUnread;
  const notifBadge = rawNotifCount > 0 ? (rawNotifCount > 99 ? '99+' : rawNotifCount) : undefined;
  const msgBadge = msgUnread > 0 ? (msgUnread > 99 ? '99+' : msgUnread) : undefined;

  // Handlers
  const handleChatClick = useCallback(async () => {
    setHideMsgBadge(true); // optimistic
    navigate(chatHref);
    try {
      if (userId) await supabase.rpc('mark_all_messages_seen', { uid: userId });
    } catch {/* best-effort */}
  }, [navigate, chatHref, userId]);

  const handleNotifClick = useCallback(async () => {
    setHideNotifBadge(true);          // optimistic
    // let <NavLink> do the navigation (no e.preventDefault)

    try {
      if (userId) {
        // clear unified notifications table
        await db.notifications.markAllRead({ userId });

        // If you STILL read from a separate vport table, clear it too.
        if (db.vportNotifications?.markAllRead) {
          await db.vportNotifications.markAllRead({ userId });
        }
      }
    } catch {/* ignore; hooks will reconcile */}

    // refresh counts immediately (no waiting for poll)
    reloadUserNotis?.();
    reloadVportNotis?.();

    // clear OS/app badge (PWA)
    try {
      navigator.serviceWorker?.controller?.postMessage?.({ type: 'BADGE_CLEAR' });
    } catch {/* noop */}
  }, [userId, reloadUserNotis, reloadVportNotis]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-800 pb-[max(0px,env(safe-area-inset-bottom))]" role="navigation" aria-label="Primary">
      <div className="max-w-[600px] mx-auto h-16 flex items-center justify-between px-6 text-white">
        <Tab to="/" label="Home" icon={<Home size={22} />} end />
        <Tab to="/explore" label="Explore" icon={<Compass size={22} />} />

        <Tab
          to={chatHref}
          label="Chat"
          icon={<MessageCircle size={22} />}
          badge={hideMsgBadge ? undefined : msgBadge}
          isActiveOverride={isChatActive}
          onClick={handleChatClick}
        />

        <button
          aria-label="New Upload"
          onClick={() => navigate('/upload')}
          className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center shadow hover:scale-95 transition-transform -mt-4 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <Plus size={24} />
        </button>

        <Tab
          to={notificationsHref}
          label="Notifications"
          icon={<Bell size={22} />}
          badge={hideNotifBadge ? undefined : notifBadge}
          isActiveOverride={isNotificationsActive}
          onClick={handleNotifClick}
        />

        <Tab to={profileHref} label="Profile" icon={<User size={22} />} isActiveOverride={isProfileActive} />
        <Tab to="/settings" label="Settings" icon={<Settings size={22} />} />
      </div>
    </nav>
  );
}

const Tab = React.memo(function Tab({ to, icon, label, badge, isActiveOverride = false, end = false, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      aria-label={label}
      className={({ isActive }) =>
        `relative flex items-center justify-center w-10 h-10 transition-all duration-150 ${
          isActive || isActiveOverride ? 'text-white' : 'text-neutral-500 hover:text-white'
        }`
      }
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
      {badge ? (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] leading-[18px] text-white text-center">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
});
