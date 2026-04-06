import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

export default function StudentsScreen() {
  const navigate = useNavigate();
  const { actorId, organizationId, loading: identityLoading } = useWentrexActorId();
  const [students, setStudents] = useState([]);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!actorId) { navigate("/login", { replace: true }); return; }
    if (!organizationId) { navigate("/dashboard", { replace: true }); return; }
    const { data: org } = await supabase.schema("learning").from("organizations").select("id, name").eq("id", organizationId).maybeSingle();
    if (!org) { navigate("/dashboard", { replace: true }); return; }
    setOrgName(org.name ?? "");

    // Get school-managed students from actor_identities
    const { data: identities } = await supabase.schema("learning").from("actor_identities")
      .select("actor_id, login_id, synthetic_email, parent_name, parent_email, must_change_password, created_at")
      .eq("organization_id", org.id).eq("is_school_managed", true).order("created_at", { ascending: false });

    const actorIds = (identities ?? []).map(i => i.actor_id);
    let profileMap = new Map();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase.schema("learning").from("actor_profiles")
        .select("actor_id, full_name, first_name, last_name, grade_level, section, student_id").in("actor_id", actorIds);
      for (const p of profiles ?? []) profileMap.set(p.actor_id, p);
    }

    setStudents((identities ?? []).map(i => ({ ...i, profile: profileMap.get(i.actor_id) ?? null })));
    setLoading(false);
  }, [actorId, organizationId, navigate]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 32px", background: "#fff", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: PRIMARY, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>L</div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>{orgName}</div><div style={{ fontSize: 12, color: MUTED }}>Students</div></div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/register-student")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Register Student</button>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer" }}>Dashboard</button>
        </div>
      </nav>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div><span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Administration</span><h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Students ({students.length})</h1></div>
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          {students.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: MUTED }}>No students registered yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: MUTED }}>Student ID</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: MUTED }}>Name</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: MUTED }}>Grade</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: MUTED }}>Section</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: MUTED }}>Guardian</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: MUTED }}>Guardian Email</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: MUTED }}>Registered</th>
                </tr></thead>
                <tbody>{students.map(s => (
                  <tr key={s.actor_id} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                    onClick={() => navigate(`/students/${s.actor_id}`)}
                    onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }} onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: PRIMARY, fontFamily: "monospace" }}>{s.login_id ?? "—"}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 500, color: "#0f172a" }}>{s.profile?.full_name ?? s.profile?.first_name ?? "—"}</td>
                    <td style={{ padding: "14px 16px", color: MUTED }}>{s.profile?.grade_level ?? "—"}</td>
                    <td style={{ padding: "14px 16px", color: MUTED }}>{s.profile?.section ?? "—"}</td>
                    <td style={{ padding: "14px 16px", color: "#0f172a" }}>{s.parent_name ?? "—"}</td>
                    <td style={{ padding: "14px 16px", color: MUTED }}>{s.parent_email ?? "—"}</td>
                    <td style={{ padding: "14px 16px", color: MUTED }}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
