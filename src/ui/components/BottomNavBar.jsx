// src/ui/components/BottomNavBar.jsx
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, User, Compass, MessageCircle, Bell, Settings } from 'lucide-react';
import { useIdentity } from '@/state/identityContext';

export default function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity } = useIdentity();

  // Profile tab destination (user vs VPORT)
  const profileHref =
    identity?.type === 'vport' && identity?.vportId ? `/vport/${identity.vportId}` : '/me';

  // ✅ Chat tab destination (user vs VPORT)
  const chatHref =
    identity?.type === 'vport' && identity?.vportId ? '/vchat' : '/chat';

  // Active-state helpers
  const isProfileActive =
    location.pathname.startsWith('/me') ||
    location.pathname.startsWith('/u/') ||
    location.pathname.startsWith('/profile/') ||
    location.pathname.startsWith('/vport/');

  // ✅ Consider both /chat and /vchat as active states for the tab
  const isChatActive =
    location.pathname.startsWith('/chat') ||
    location.pathname.startsWith('/vchat');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-800 pb-[max(0px,env(safe-area-inset-bottom))]" role="navigation" aria-label="Primary">
      <div className="max-w-[600px] mx-auto h-16 flex items-center justify-between px-6 text-white">
        <Tab to="/" label="Home" icon={<Home size={22} />} end />
        <Tab to="/explore" label="Explore" icon={<Compass size={22} />} />

        {/* ✅ Use chatHref + isChatActive */}
        <Tab to={chatHref} label="Chat" icon={<MessageCircle size={22} />} isActiveOverride={isChatActive} />

        <button
          aria-label="New Upload"
          onClick={() => navigate('/upload')}
          className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center shadow hover:scale-95 transition-transform -mt-4 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <Plus size={24} />
        </button>

        <Tab to="/notifications" label="Notifications" icon={<Bell size={22} />} />
        <Tab to={profileHref} label="Profile" icon={<User size={22} />} isActiveOverride={isProfileActive} />
        <Tab to="/settings" label="Settings" icon={<Settings size={22} />} />
      </div>
    </nav>
  );
}

const Tab = React.memo(function Tab({ to, icon, label, badge, isActiveOverride = false, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
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
