import { NavLink } from "react-router-dom";

export default function SidebarItem({ to, label, meta, icon: Icon, end = false }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `mt-sidebar-link${isActive ? " mt-sidebar-link--active" : ""}`}>
      <span className="mt-sidebar-link__icon">
        {Icon ? <Icon size={17} strokeWidth={2.2} aria-hidden="true" /> : null}
      </span>
      <span className="mt-sidebar-link__text">
        <span>{label}</span>
        {meta ? <small>{meta}</small> : null}
      </span>
    </NavLink>
  );
}
