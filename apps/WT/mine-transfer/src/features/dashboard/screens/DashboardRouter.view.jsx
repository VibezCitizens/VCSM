import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import { LockKeyhole } from "lucide-react";

const MineTransferDashboard = lazy(() => import("@/features/dashboard/mine-transfer/MineTransferDashboard.view"));
const TrazeDashboard      = lazy(() => import("@/features/dashboard/traze/screens/TrazeDashboard.view"));
const TrazeProviders      = lazy(() => import("@/features/dashboard/traze/screens/TrazeProviders.view"));
const TrazeProviderNew    = lazy(() => import("@/features/dashboard/traze/screens/TrazeProviderNew.view"));
const TrazeProviderDetail = lazy(() => import("@/features/dashboard/traze/screens/TrazeProviderDetail.view"));
const TrazeIntake         = lazy(() => import("@/features/dashboard/traze/screens/TrazeIntake.view"));
const TrazeSeeds          = lazy(() => import("@/features/dashboard/traze/screens/TrazeSeeds.view"));
const TrazeClaims         = lazy(() => import("@/features/dashboard/traze/screens/TrazeClaims.view"));
const TrazeCities         = lazy(() => import("@/features/dashboard/traze/screens/TrazeCities.view"));
const TrazeServices       = lazy(() => import("@/features/dashboard/traze/screens/TrazeServices.view"));
const TrazeSeo            = lazy(() => import("@/features/dashboard/traze/screens/TrazeSeo.view"));
const VcsmDashboard       = lazy(() => import("@/features/dashboard/vcsm/screens/VcsmDashboard.view"));
const WentrexDashboard    = lazy(() => import("@/features/dashboard/wentrex/screens/WentrexDashboard.view"));
const TripointProduct     = lazy(() => import("@/features/dashboard/tripoint/screens/TripointProduct.view"));

function DashboardLoading() {
  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="brand-lockup">
          <span className="brand-lockup__mark"><LockKeyhole size={22} /></span>
          <div><strong>VCSM</strong><span>Product Hub</span></div>
        </div>
      </aside>
      <section
        className="dashboard-main"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-muted)", fontSize: "0.95rem" }}
      >
        Loading…
      </section>
      <aside className="dashboard-rail" />
    </main>
  );
}

const ROUTES = [
  { index: true, element: <MineTransferDashboard /> },
  {
    path: "traze",
    children: [
      { index: true, element: <TrazeDashboard /> },
      {
        path: "providers",
        children: [
          { index: true,           element: <TrazeProviders /> },
          { path: "new",           element: <TrazeProviderNew /> },
          { path: ":providerId",   element: <TrazeProviderDetail /> },
        ],
      },
      { path: "intake",    element: <TrazeIntake /> },
      { path: "seeds",     element: <TrazeSeeds /> },
      { path: "claims",    element: <TrazeClaims /> },
      { path: "cities",    element: <TrazeCities /> },
      { path: "locations", element: <TrazeCities /> },
      { path: "services",  element: <TrazeServices /> },
      { path: "categories", element: <TrazeServices /> },
      { path: "seo",       element: <TrazeSeo /> },
    ],
  },
  { path: "vcsm",     element: <VcsmDashboard /> },
  { path: "wentrex",  element: <WentrexDashboard /> },
  { path: "tripoint", element: <TripointProduct /> },
  { path: "*",        element: <Navigate to="/dashboard" replace /> },
];

export default function DashboardRouter() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      {useRoutes(ROUTES)}
    </Suspense>
  );
}
