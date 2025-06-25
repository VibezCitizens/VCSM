import { NavLink } from 'react-router-dom';
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
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-800">
      <div className="max-w-[600px] mx-auto h-16 flex items-center justify-between px-6 text-white">
        {/* Left group */}
        <NavItem to="/" icon={<Home size={22} />} label="Home" />
        <NavItem to="/explore" icon={<Search size={22} />} label="Explore" />
        <NavItem to="/chat" icon={<MessageCircle size={22} />} label="Chat" />

        {/* Center button — embedded in flow */}
        <NavLink
          to="/upload"
          aria-label="New Post"
          className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center shadow hover:scale-95 transition-transform -mt-4"
        >
          <Plus size={24} />
        </NavLink>

        {/* Right group */}
        <NavItem to="/notifications" icon={<Bell size={22} />} label="Notifications" />
        <NavItem to="/me" icon={<User size={22} />} label="Profile" />
        <NavItem to="/settings" icon={<Settings size={22} />} label="Settings" />
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

export default BottomNavBar;
