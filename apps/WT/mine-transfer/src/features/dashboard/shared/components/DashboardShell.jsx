import { NavLink, Link, useLocation } from "react-router-dom";
import "@/features/dashboard/screens/TripointDashboard.css";
import {
  Activity, BarChart3, Building2, Database, FileCheck,
  Inbox, Layers, LayoutDashboard, LockKeyhole, MapPin, Plus, Search,
  Sprout, Users, Wrench,
} from "lucide-react";

const PRODUCT_NAV = [
  { to: "/dashboard",          label: "Hub",      icon: Layers,         end: true  },
  { to: "/dashboard/traze",    label: "Traze",    icon: Activity,       end: false },
  { to: "/dashboard/vcsm",     label: "VCSM",     icon: LayoutDashboard,end: false },
  { to: "/dashboard/wentrex",  label: "Wentrex",  icon: Database,       end: false },
  { to: "/dashboard/tripoint", label: "Tripoint", icon: Building2,      end: false },
];

const TRAZE_SUBNAV = [
  { to: "/dashboard/traze",              label: "Overview",  icon: BarChart3, end: true  },
  { to: "/dashboard/traze/providers",    label: "Providers", icon: Users,     end: false },
  { to: "/dashboard/traze/intake",       label: "Intake",    icon: Inbox,     end: false },
  { to: "/dashboard/traze/seeds",        label: "Seed Intake", icon: Sprout,  end: false },
  { to: "/dashboard/traze/claims",       label: "Claims",    icon: FileCheck, end: false },
  { to: "/dashboard/traze/locations",    label: "Locations", icon: MapPin,    end: false },
  { to: "/dashboard/traze/categories",   label: "Categories",icon: Wrench,    end: false },
  { to: "/dashboard/traze/seo",          label: "SEO",       icon: Search,    end: false },
];

const navClass = ({ isActive }) =>
  isActive ? "sidebar-menu__item sidebar-menu__item--active" : "sidebar-menu__item";

const LABEL = {
  display: "block",
  padding: "0 1rem",
  marginTop: "1.25rem",
  marginBottom: "0.25rem",
  fontSize: "0.6rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.3)",
};

const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }) : null;

export default function DashboardShell({ children, rail, fetchedAt }) {
  const { pathname } = useLocation();
  const onTraze = pathname.startsWith("/dashboard/traze");
  const shellClass = `dashboard-shell${rail ? "" : " dashboard-shell--no-rail"}`;

  return (
    <main className={shellClass}>
      <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="brand-lockup">
          <span className="brand-lockup__mark">
            <LockKeyhole size={22} />
          </span>
          <div>
            <strong>VCSM</strong>
            <span>Product Hub</span>
          </div>
        </div>

        <nav className="sidebar-menu" aria-label="Product navigation">
          <span style={LABEL}>Products</span>
          {PRODUCT_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {onTraze && (
            <>
              <span style={LABEL}>Traze</span>
              {TRAZE_SUBNAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={navClass}>
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
              <NavLink
                to="/dashboard/traze/providers/new"
                className={navClass}
              >
                <Plus size={18} />
                <span>New business</span>
              </NavLink>
            </>
          )}
        </nav>

        {fetchedAt && (
          <div className="snapshot-card">
            <Database size={18} />
            <div>
              <span>Live Supabase feed</span>
              <strong>Updated {shortDate(fetchedAt)}</strong>
            </div>
          </div>
        )}
      </aside>

      <section className="dashboard-main">{children}</section>

      {rail && (
        <aside className="dashboard-rail" aria-label="Product summary">
          {rail}
        </aside>
      )}
    </main>
  );
}
