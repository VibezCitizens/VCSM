import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Plus,
  User,
  Search,
  MessageCircle,
  Bell,
  Settings,
} from 'lucide-react';
import React from 'react';

function BottomNavBar() {
  const location = useLocation();
  const isInVoid = location.pathname.startsWith('/void');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-800">
      <div className="max-w-[600px] mx-auto h-16 flex items-center justify-between px-6 text-white">
        {/* Left group */}
        {isInVoid ? <BlockedIcon /> : <NavItem to="/" icon={<Home size={22} />} label="Home" />}
        {isInVoid ? <BlockedIcon /> : <NavItem to="/explore" icon={<Search size={22} />} label="Explore" />}
        {isInVoid ? <BlockedIcon /> : <NavItem to="/chat" icon={<MessageCircle size={22} />} label="Chat" />}

        {/* Center button */}
        {isInVoid ? (
          <BlockedIcon isCenter />
        ) : (
          <NavLink
            to="/upload"
            aria-label="New Post"
            className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center shadow hover:scale-95 transition-transform -mt-4"
          >
            <Plus size={24} />
          </NavLink>
        )}

        {/* Right group */}
        {isInVoid ? <BlockedIcon /> : <NavItem to="/notifications" icon={<Bell size={22} />} label="Notifications" />}
        {isInVoid ? <BlockedIcon /> : <NavItem to="/me" icon={<User size={22} />} label="Profile" />}
        {isInVoid ? <BlockedIcon /> : <NavItem to="/settings" icon={<Settings size={22} />} label="Settings" />}
      </div>
    </nav>
  );
}

const NavItem = React.memo(({ to, icon, label }) => (
  <NavLink
    to={to}
    aria-label={label}
    className={({ isActive }) =>
      `flex items-center justify-center w-10 h-10 transition-all duration-150 ${
        isActive ? 'text-white' : 'text-neutral-500 hover:text-white'
      }`
    }
  >
    {icon}
  </NavLink>
));

const BlockedIcon = ({ isCenter }) => (
  <div
    className={`${
      isCenter
        ? 'bg-neutral-800 text-white w-12 h-12 rounded-full flex items-center justify-center -mt-4'
        : 'flex items-center justify-center w-10 h-10 text-neutral-600'
    }`}
    title="Unavailable in The Void"
  >
    🚫
  </div>
);

export default BottomNavBar;
