import { lazy, Suspense } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { useTripointDashboardAccess } from "@/features/dashboard/hooks/useTripointDashboardAccess";
import "./TripointDashboardGate.css";

const DashboardRouter = lazy(() => import("./DashboardRouter.view"));

function DashboardGateShell({ icon: Icon, eyebrow, title, children }) {
  return (
    <main className="dashboard-gate">
      <section className="dashboard-gate__card">
        <span className="dashboard-gate__icon">
          <Icon size={24} />
        </span>
        <span className="dashboard-gate__eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

export default function TripointDashboardGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { access, retry, signOut } = useTripointDashboardAccess();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true, state: { from: location } });
  }

  if (access.status === "checking") {
    return (
      <DashboardGateShell icon={LockKeyhole} eyebrow="Secure dashboard" title="Verifying access">
        <div className="dashboard-gate__spinner" />
      </DashboardGateShell>
    );
  }

  if (access.status === "signed-out") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (access.status === "denied") {
    return (
      <DashboardGateShell icon={ShieldAlert} eyebrow="Access denied" title="This dashboard is locked">
        <p>
          This dashboard is restricted to approved accounts. Sign out and use an approved account to continue.
        </p>
        {access.user?.email ? <strong>{access.user.email}</strong> : null}
        <button type="button" onClick={handleSignOut}>Sign out</button>
      </DashboardGateShell>
    );
  }

  if (access.status === "error") {
    return (
      <DashboardGateShell icon={ShieldAlert} eyebrow="Access check failed" title="Dashboard is locked">
        <p>
          Access could not be verified against Supabase. The dashboard remains locked until that check succeeds.
        </p>
        <button type="button" onClick={retry}>Try again</button>
      </DashboardGateShell>
    );
  }

  return (
    <Suspense
      fallback={
        <DashboardGateShell icon={LockKeyhole} eyebrow="Secure dashboard" title="Loading dashboard">
          <div className="dashboard-gate__spinner" />
        </DashboardGateShell>
      }
    >
      <DashboardRouter />
    </Suspense>
  );
}
