import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useLearningRouteContext } from "@/learning/administration/hooks/shared/useLearningRouteContext";
import LearningLoadingState from "@/learning/administration/components/shared/LearningLoadingState";
import LearningErrorState from "@/learning/administration/components/shared/LearningErrorState";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { realmSlug } = useParams();
  const learning = useLearningRouteContext();
  const base = `/learning/${realmSlug}/admin`;
  const NAV_LINKS = [
    { to: base, label: "Dashboard", end: true },
    { to: `${base}/access`, label: "Access Management" },
    { to: `${base}/platform-admins`, label: "Platform Admins" },
  ];

  if (learning.isLoading) {
    return <LearningLoadingState label="Loading administration..." variant="home" />;
  }

  if (learning.error && !learning.isReady) {
    return <LearningErrorState error={learning.error} onRetry={learning.reload} />;
  }

  return (
    <div className="role-layout">
      <aside className="role-sidebar">
        <div className="role-sidebar-header">
          <button
            type="button"
            className="role-back-link"
            onClick={() => navigate(`/learning/${realmSlug}`)}
          >
            ← Back to portal
          </button>
          <div className="role-sidebar-title">Administration</div>
          <div className="role-sidebar-subtitle">
            {learning.realm?.name ?? "Learning workspace"}
          </div>
        </div>

        <nav className="role-nav">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `role-nav-link${isActive ? " role-nav-link-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="role-main">
        <Outlet context={learning} />
      </main>
    </div>
  );
}
