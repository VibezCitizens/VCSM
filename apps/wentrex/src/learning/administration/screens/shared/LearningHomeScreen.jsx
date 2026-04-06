import {
  Bell,
  Building2,
  GraduationCap,
  MessageSquare,
  ShieldUser,
  UserCircle2,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import MetricCard from "./components/MetricCard";
import ModuleCard from "./components/ModuleCard";
import AdminModuleCard from "./components/AdminModuleCard";
import TeacherModuleCard from "./components/TeacherModuleCard";
import ParentModuleCard from "./components/ParentModuleCard";
import StudentModuleCard from "./components/StudentModuleCard";
import ShortcutCard from "./components/ShortcutCard";
import CourseAccessRow from "./components/CourseAccessRow";

export default function LearningHomeScreen({
  actorId,
  supabase,
  realm,
  realmSlug,
  courses = [],
  groupedCourses = {},
  summary = {},
  organizations = [],
}) {
  const navigate = useNavigate();

  const base = realmSlug ? `/learning/${realmSlug}` : "/learning";
  const roleCounts = summary.roleCounts ?? {};
  const modules = [
    {
      key: "administration",
      title: "Administration",
      description:
        "Manage organizations, rosters, and course operations across the LMS.",
      count: roleCounts.administration ?? 0,
      previewCourses: groupedCourses.administration ?? [],
      icon: ShieldUser,
      actionLabel: "Open Administration",
      onOpen: () => navigate(`${base}/admin`),
      realmSlug,
      organizations,
    },
    {
      key: "teachers",
      title: "Teachers",
      description:
        "Open teaching workspaces, course views, and submission review flows.",
      count: roleCounts.teacher ?? 0,
      icon: UsersRound,
      actionLabel: "Open Teacher Workspace",
      onOpen: () => navigate(`${base}/teacher`),
      organizations,
    },
    {
      key: "parents",
      title: "Parents",
      description:
        "Track observed students, assignment status, and classroom progress.",
      count: roleCounts.parent ?? 0,
      previewCourses: groupedCourses.parent ?? [],
      icon: Building2,
      actionLabel: "Open Parent Workspace",
      onOpen: () => navigate(`${base}/parent`),
      organizations,
      supabase,
    },
    {
      key: "students",
      title: "Students",
      description:
        "Continue lessons, review grades, and stay aligned with coursework.",
      count: roleCounts.student ?? 0,
      previewCourses: groupedCourses.student ?? [],
      icon: GraduationCap,
      actionLabel: "Open Student Workspace",
      onOpen: () => navigate(`${base}/student`),
      organizations,
      supabase,
      actorId,
    },
  ];

  const shortcuts = [
    {
      key: "overview",
      title: "Workspace Overview",
      description:
        "Return to the tenant portal and review access across roles in one place.",
      actionLabel: "Open Overview",
      icon: UserCircle2,
      onOpen: () => navigate(base),
    },
    {
      key: "teacher",
      title: "Teacher Routes",
      description:
        "Jump straight into delivery, assignments, and submission review flows.",
      actionLabel: "Open Teacher Workspace",
      icon: MessageSquare,
      onOpen: () => navigate(`${base}/teacher`),
    },
    {
      key: "student",
      title: "Student Routes",
      description:
        "Open learner progress, course access, and assignment routes.",
      actionLabel: "Open Student Workspace",
      icon: Bell,
      onOpen: () => navigate(`${base}/student`),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <section
        className="learning-card"
        style={{
          padding: 28,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="learning-shell-eyebrow">Main Feature</span>
          <div>
            <h2 style={{ margin: "0 0 10px", fontSize: 30 }}>
              {realm?.name ?? "WENTREX"}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--learning-muted-text)",
                maxWidth: 700,
              }}
            >
              This folder is being turned into a dedicated LMS feature. Social feed concepts stay out
              of this workspace, while profile, chat, and notifications remain available as support
              systems around learning.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="learning-badge">{summary.activeCourses ?? 0} active courses</span>
            <span className="learning-badge">
              {summary.totalAvailableCourses ?? 0} available in catalog
            </span>
            <span className="learning-badge">{courses.length} current memberships</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <MetricCard
            label="Admin Access"
            value={roleCounts.administration ?? 0}
            helper="Organization and roster operations"
          />
          <MetricCard
            label="Teacher Access"
            value={roleCounts.teacher ?? 0}
            helper="Teaching workspaces"
          />
          <MetricCard
            label="Parent Access"
            value={roleCounts.parent ?? 0}
            helper="Observed student access"
          />
          <MetricCard
            label="Student Access"
            value={roleCounts.student ?? 0}
            helper="Learner workspaces"
          />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h2 style={{ margin: "0 0 8px" }}>Learning Modules</h2>
          <p style={{ margin: 0, color: "var(--learning-muted-text)" }}>
            Open the role-specific workspace you need without leaving the LMS feature.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {modules.map(({ key, ...item }) => {
            console.log("[LearningHomeScreen] rendering module", key, {
              count: item.count,
              hasOrgs: (item.organizations?.length ?? 0) > 0,
              orgsCount: item.organizations?.length,
              hasSupa: Boolean(item.supabase),
              hasActorId: Boolean(item.actorId),
            });
            return key === "administration" ? (
              <AdminModuleCard key={key} {...item} />
            ) : key === "teachers" ? (
              <TeacherModuleCard key={key} {...item} />
            ) : key === "parents" ? (
              <ParentModuleCard key={key} {...item} />
            ) : key === "students" ? (
              <StudentModuleCard key={key} {...item} />
            ) : (
              <ModuleCard key={key} {...item} />
            );
          })}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h2 style={{ margin: "0 0 8px" }}>Workspace Shortcuts</h2>
          <p style={{ margin: 0, color: "var(--learning-muted-text)" }}>
            Every shortcut below stays inside the routes that are available in this local LMS build.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {shortcuts.map(({ key, ...item }) => (
            <ShortcutCard key={key} {...item} />
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h2 style={{ margin: "0 0 8px" }}>Current Course Access</h2>
          <p style={{ margin: 0, color: "var(--learning-muted-text)" }}>
            Jump straight into any course membership from the LMS overview.
          </p>
        </div>

        {courses.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {courses.map((course) => (
              <CourseAccessRow
                key={course.id}
                course={course}
                onOpen={(item) => navigate(`/learning/courses/${item.id}`)}
              />
            ))}
          </div>
        ) : (
          <div
            className="learning-card"
            style={{
              padding: 24,
              color: "var(--learning-muted-text)",
            }}
          >
            No course memberships are assigned yet.
          </div>
        )}
      </section>
    </div>
  );
}
