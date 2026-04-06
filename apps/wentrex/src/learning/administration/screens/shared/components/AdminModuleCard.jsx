import {
  ArrowRight,
  BarChart2,
  Building2,
  CalendarDays,
  GraduationCap,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminQuickAction from "./AdminQuickAction";

export default function AdminModuleCard({ icon: Icon, title, description, count, actionLabel, onOpen, realmSlug = "", organizations = [] }) {
  const navigate = useNavigate();
  // count reflects course-level admin memberships; organizations reflects org-level access.
  // A user can be an org admin without any course memberships, so check both.
  const hasAccess = count > 0 || organizations.length > 0;
  const base = realmSlug ? `/learning/${realmSlug}/admin` : "/learning/admin";

  const quickActions = [
    {
      key: "organization",
      label: "Organization",
      icon: Building2,
      path: `${base}/organizations`,
    },
    {
      key: "staff",
      label: "Staff",
      icon: UsersRound,
      path: `${base}/staff`,
    },
    {
      key: "courses",
      label: "Courses",
      icon: GraduationCap,
      path: `${base}/courses`,
    },
    {
      key: "terms",
      label: "Terms",
      icon: CalendarDays,
      path: `${base}/terms`,
    },
    {
      key: "enrollment",
      label: "Enrollment",
      icon: UserPlus,
      path: `${base}/enrollments`,
    },
    {
      key: "reporting",
      label: "Reporting",
      icon: BarChart2,
      path: `${base}/reports`,
    },
  ];

  return (
    <div
      className="learning-card"
      style={{
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 270,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "rgba(15, 74, 114, 0.1)",
          color: "var(--learning-primary)",
        }}
      >
        <Icon size={22} />
      </div>

      {/* Title + badge + description */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <span className="learning-badge">{count} access</span>
        </div>
        <p style={{ margin: 0, color: "var(--learning-muted-text)", lineHeight: 1.5 }}>
          {description}
        </p>
      </div>

      {/* Quick actions -- 2-col grid, collapses to 1-col when card is narrow */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 8,
        }}
        role="group"
        aria-label="Administration quick actions"
      >
        {quickActions.map((action) => (
          <AdminQuickAction
            key={action.key}
            icon={action.icon}
            label={action.label}
            disabled={!hasAccess}
            ariaLabel={`Go to ${action.label}`}
            onClick={() => navigate(action.path)}
          />
        ))}
      </div>

      {/* Main CTA */}
      <button
        type="button"
        className={`learning-button ${hasAccess ? "learning-button-primary" : "learning-button-secondary"}`}
        onClick={onOpen}
        disabled={!hasAccess}
        style={{
          marginTop: "auto",
          opacity: hasAccess ? 1 : 0.6,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span>{hasAccess ? actionLabel : "Access pending"}</span>
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
