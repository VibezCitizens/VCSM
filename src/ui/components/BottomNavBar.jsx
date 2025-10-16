// src/ui/components/BottomNavBar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Plus, User, Compass, MessageCircle, Bell, Settings } from 'lucide-react';

import useNotiCount from '@/features/notifications/notificationcenter/hooks/useNotiCount';
import useUnreadBadge from '@/features/chat/hooks/useUnreadBadge';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';

export default function BottomNavBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useIdentity();

  // unseen notifications (user hook — you can swap to a VPORT hook later if you want separate counts)
  const notiCount = useNotiCount();

  // total unread DMs (live) — still counting user inbox; you can add a VPORT version later
  const chatUnread = useUnreadBadge(user?.id);

  // when acting as VPORT, route bell and chat to VPORT screens
  const isVport = identity?.type === 'vport' && !!identity?.vportId;
  const notificationsPath = isVport ? '/vport/notifications' : '/notifications';
  const chatPath = isVport ? '/vport/chat' : '/chat';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-800 pb-[max(0px,env(safe-area-inset-bottom))]"
      role="navigation"
      aria-label="Primary"
    >
      <div className="max-w-[600px] mx-auto h-16 flex items-center justify-between px-6 text-white">
        {/* Home -> central feed */}
        <Tab to="/feed" label="Home" icon={<Home size={22} />} end />

        {/* Explore */}
        <Tab to="/explore" label="Explore" icon={<Compass size={22} />} />

        {/* Chat (routes to user or VPORT inbox) */}
        <Tab
          to={chatPath}
          label={chatUnread > 0 ? `Chat (${chatUnread})` : 'Chat'}
          icon={<MessageCircle size={22} />}
          badgeCount={chatUnread}
        />

        {/* Upload (center action button) */}
        <button
          aria-label="New Upload"
          onClick={() => navigate('/upload')}
          className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center shadow hover:scale-95 transition-transform -mt-4 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <Plus size={24} />
        </button>

        {/* Notifications (route depends on identity) */}
        <Tab
          to={notificationsPath}
          label={notiCount > 0 ? `Notifications (${notiCount})` : 'Notifications'}
          icon={<Bell size={22} />}
          badgeCount={notiCount}
        />

        {/* Profile */}
        <Tab to="/me" label="Profile" icon={<User size={22} />} />

        {/* Settings */}
        <Tab to="/settings" label="Settings" icon={<Settings size={22} />} />
      </div>
    </nav>
  );
}

const Tab = React.memo(function Tab({ to, icon, label, end = false, badgeCount = 0, badgeMax = 99 }) {
  const showBadge = Number(badgeCount) > 0;
  const badgeText = badgeCount > badgeMax ? `${badgeMax}+` : String(badgeCount);

  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        `relative flex items-center justify-center w-10 h-10 transition-all duration-150 ${
          isActive ? 'text-white' : 'text-neutral-500 hover:text-white'
        }`
      }
    >
      <span className="inline-flex items-center justify-center">{icon}</span>

      {showBadge && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1.5 rounded-full
                     bg-red-500 text-white text-[10px] leading-[18px] text-center font-medium
                     shadow"
          aria-hidden="true"
        >
          {badgeText}
        </span>
      )}
    </NavLink>
  );
});
