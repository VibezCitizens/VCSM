import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{label}</span>
      <strong style={{ fontSize: 28, lineHeight: 1.1, color: accent ?? "#0f172a" }}>{value}</strong>
    </div>
  );
}

export default function ParentDashboardScreen() {
  const navigate = useNavigate();
  const { actorId, organizationId, loading: identityLoading } = useWentrexActorId();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [children, setChildren] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);

  const load = useCallback(async () => {
    if (!actorId) { navigate("/login", { replace: true }); return; }

    // Display email — cached session read
    const { data: { session } } = await supabase.auth.getSession();
    setUserName(session?.user?.email ?? "");

    if (organizationId) {
      const { data: org } = await supabase.schema("learning").from("organizations")
        .select("name").eq("id", organizationId).maybeSingle();
      setOrgName(org?.name ?? "");
    }

    // Linked students
    const { data: links } = await supabase.schema("learning").from("parent_student_links")
      .select("id, student_actor_id, relationship, is_primary")
      .eq("parent_actor_id", actorId);

    if (!links?.length) { setChildren([]); setLoading(false); return; }

    const studentIds = links.map(l => l.student_actor_id);

    // Profiles
    const { data: profiles } = await supabase.schema("learning").from("actor_profiles")
      .select("actor_id, full_name, student_id, grade_level, section")
      .in("actor_id", studentIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.actor_id, p]));

    const { data: memberships } = await supabase.schema("learning").from("course_memberships")
      .select("actor_id")
      .in("actor_id", studentIds).eq("role", "student").eq("status", "active");

    let courseCount = 0;
    const coursesPerStudent = new Map();
    for (const m of memberships ?? []) {
      coursesPerStudent.set(m.actor_id, (coursesPerStudent.get(m.actor_id) ?? 0) + 1);
      courseCount++;
    }
    setTotalCourses(courseCount);

    setChildren(links.map(link => ({
      ...link,
      profile: profileMap.get(link.student_actor_id),
      courseCount: coursesPerStudent.get(link.student_actor_id) ?? 0,
    })));

    setLoading(false);
  }, [navigate]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName={orgName} subtitle="Parent Portal" userName={userName} role="parent" settingsTo="/parent/settings" />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Parent Dashboard</span>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Welcome back</h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <StatCard label="My Children" value={children.length} />
          <StatCard label="Total Courses" value={totalCourses} />
          <StatCard label="Open Alerts" value={0} accent={MUTED} />
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div onClick={() => navigate("/messages")}
            style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 22px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Messages</span>
            <span style={{ fontSize: 13, color: MUTED }}>Chat with your child's teachers</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY, marginTop: 4 }}>Open Messages →</span>
          </div>
          <div onClick={() => navigate("/parent/settings")}
            style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 22px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Settings</span>
            <span style={{ fontSize: 13, color: MUTED }}>Account and preferences</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY, marginTop: 4 }}>Open Settings →</span>
          </div>
        </div>

        {/* Children */}
        <section>
          <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>My Children</h2>

          {children.length === 0 ? (
            <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, textAlign: "center", color: MUTED }}>
              No students linked to your account. Contact your school.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {children.map(child => (
                <div key={child.id} style={{
                  background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
                  padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer",
                }}
                  onClick={() => navigate(`/parent/student/${child.student_actor_id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                        {child.profile?.full_name ?? "Student"}
                      </span>
                      {child.is_primary && (
                        <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: "#dcfce7", color: "#166534" }}>Primary</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: 13, color: MUTED }}>
                      {child.profile?.student_id && <span>ID: <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>{child.profile.student_id}</strong></span>}
                      {child.profile?.grade_level && <span>{child.profile.grade_level}</span>}
                      {child.profile?.section && <span>Sec. {child.profile.section}</span>}
                      <span>{child.relationship}</span>
                      <span>{child.courseCount} course{child.courseCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: PRIMARY }}>View Details →</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent */}
        <section>
          <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Recent Activity</h2>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24, textAlign: "center", color: MUTED, fontSize: 14 }}>
            No recent activity.
          </div>
        </section>
      </div>
    </div>
  );
}
