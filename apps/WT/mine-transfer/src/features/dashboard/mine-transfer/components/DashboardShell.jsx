import { Activity, Building2, Gauge, Layers3, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import SidebarItem from "@/features/dashboard/mine-transfer/components/SidebarItem";

const PRIMARY_NAV = [
  { to: "/dashboard", label: "Overview", meta: "Command center", icon: Gauge, end: true },
  { to: "/dashboard/traze", label: "Traze", meta: "Primary platform", icon: Activity },
  { to: "/dashboard/vcsm", label: "VCSM", meta: "Citizen network", icon: Layers3 },
  { to: "/dashboard/tripoint", label: "Tripoint", meta: "Locksmith ops", icon: Building2 },
];

const TRAZE_NAV = [
  { to: "/dashboard/traze/providers", label: "Providers", meta: "Directory supply", icon: ShieldCheck },
  { to: "/dashboard/traze/cities", label: "Cities", meta: "Location coverage", icon: Search },
];

export default function DashboardShell({ children, fetchedAt }) {
  const updatedLabel = fetchedAt
    ? new Date(fetchedAt).toLocaleDateString("en", { month: "short", day: "numeric" })
    : "Pending data";

  return (
    <main className="mt-shell">
      <aside className="mt-shell__sidebar" aria-label="Ecosystem navigation">
        <div className="mt-brand">
          <span className="mt-brand__mark"><Layers3 size={23} strokeWidth={2.25} /></span>
          <div>
            <strong>Vibez Citizens</strong>
            <span>Command Center</span>
          </div>
        </div>

        <nav className="mt-sidebar-nav" aria-label="Main dashboard navigation">
          <span className="mt-nav-kicker">Platforms</span>
          {PRIMARY_NAV.map((item) => <SidebarItem key={item.to} {...item} />)}

          <span className="mt-nav-kicker mt-nav-kicker--spaced">Traze focus</span>
          {TRAZE_NAV.map((item) => <SidebarItem key={item.to} {...item} />)}
        </nav>

        <div className="mt-sidebar-status">
          <LockKeyhole size={18} strokeWidth={2.2} />
          <div>
            <span>Read-only UI</span>
            <strong>Data updated {updatedLabel}</strong>
          </div>
        </div>
      </aside>

      <section className="mt-shell__main" aria-label="Ecosystem dashboard">
        {children}
      </section>
    </main>
  );
}
