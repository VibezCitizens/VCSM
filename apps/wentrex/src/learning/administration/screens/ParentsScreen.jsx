import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

export default function ParentsScreen() {
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }
    const { data: actor } = await supabase.schema("learning").from("actors").select("id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (!actor) { navigate("/dashboard", { replace: true }); return; }
    const { data: mem } = await supabase.schema("learning").from("organization_memberships").select("organization_id").eq("actor_id", actor.id).eq("status", "active").limit(1).maybeSingle();
    if (!mem) { navigate("/dashboard", { replace: true }); return; }
    const { data: org } = await supabase.schema("learning").from("organizations").select("id, name").eq("id", mem.organization_id).maybeSingle();
    setOrgName(org?.name ?? "");

    // Get parent-student links
    const { data: links } = await supabase.schema("learning").from("parent_student_links")
      .select("id, parent_actor_id, student_actor_id, relationship, is_primary, created_at")
      .eq("organization_id", org?.id).order("created_at", { ascending: false });

    if (!links || links.length === 0) {
      setParents([]);
      setLoading(false);
      return;
    }

    // Get unique actor IDs (parents + students)
    const parentActorIds = [...new Set(links.map(l => l.parent_actor_id))];
    const studentActorIds = [...new Set(links.map(l => l.student_actor_id))];
    const allActorIds = [...new Set([...parentActorIds, ...studentActorIds])];

    // Fetch profiles from actor_profiles
    const profileMap = new Map();
    const { data: actorProfiles } = await supabase.schema("learning").from("actor_profiles")
      .select("actor_id, full_name, student_id").in("actor_id", allActorIds);
    for (const p of actorProfiles ?? []) profileMap.set(p.actor_id, p);

    // Fetch parent emails from actors → auth users
    const { data: parentActors } = await supabase.schema("learning").from("actors")
      .select("id, user_id").in("id", parentActorIds);
    const parentUserIds = (parentActors ?? []).map(a => a.user_id).filter(Boolean);

    const emailMap = new Map();
    if (parentUserIds.length > 0) {
      const { data: pubProfiles } = await supabase.from("profiles")
        .select("id, display_name, email").in("id", parentUserIds);
      for (const p of pubProfiles ?? []) emailMap.set(p.id, p);
    }

    // Also check actor_identities for student info
    const { data: identities } = await supabase.schema("learning").from("actor_identities")
      .select("actor_id, login_id, parent_name, parent_email").in("actor_id", studentActorIds);
    const identityMap = new Map((identities ?? []).map(i => [i.actor_id, i]));

    // Build parent rows grouped by parent_actor_id
    const parentMap = new Map();
    for (const link of links) {
      if (!parentMap.has(link.parent_actor_id)) {
        const parentActor = (parentActors ?? []).find(a => a.id === link.parent_actor_id);
        const pubProfile = parentActor ? emailMap.get(parentActor.user_id) : null;
        const actorProfile = profileMap.get(link.parent_actor_id);

        parentMap.set(link.parent_actor_id, {
          actorId: link.parent_actor_id,
          name: actorProfile?.full_name || pubProfile?.display_name || "Unknown",
          email: pubProfile?.email || "",
          children: [],
        });
      }

      const studentProfile = profileMap.get(link.student_actor_id);
      const studentIdentity = identityMap.get(link.student_actor_id);

      parentMap.get(link.parent_actor_id).children.push({
        actorId: link.student_actor_id,
        name: studentProfile?.full_name || "Unknown",
        studentId: studentProfile?.student_id || studentIdentity?.login_id || "",
        relationship: link.relationship,
        isPrimary: link.is_primary,
        linkedAt: link.created_at,
      });
    }

    setParents([...parentMap.values()]);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 32px", background: "#fff", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: PRIMARY, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>L</div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>{orgName}</div><div style={{ fontSize: 12, color: MUTED }}>Parents</div></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/link-parent")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Link Parent</button>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer" }}>Dashboard</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Administration</span>
          <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Parents ({parents.length})</h1>
        </div>

        {parents.length === 0 ? (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 40, textAlign: "center", color: MUTED }}>
            <p style={{ margin: "0 0 16px", fontSize: 15 }}>No parents linked yet.</p>
            <button onClick={() => navigate("/link-parent")} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: PRIMARY, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              + Link a Parent
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {parents.map(p => (
              <div key={p.actorId} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
                {/* Parent header */}
                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: MUTED }}>{p.email}</div>
                  </div>
                  <span style={{ padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "#dbeafe", color: "#1e40af" }}>
                    {p.children.length} {p.children.length === 1 ? "child" : "children"}
                  </span>
                </div>

                {/* Linked students */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
                      <th style={{ textAlign: "left", padding: "8px 20px", fontWeight: 600, color: MUTED, fontSize: 12 }}>Student</th>
                      <th style={{ textAlign: "left", padding: "8px 20px", fontWeight: 600, color: MUTED, fontSize: 12 }}>Student ID</th>
                      <th style={{ textAlign: "left", padding: "8px 20px", fontWeight: 600, color: MUTED, fontSize: 12 }}>Relationship</th>
                      <th style={{ textAlign: "left", padding: "8px 20px", fontWeight: 600, color: MUTED, fontSize: 12 }}>Primary</th>
                      <th style={{ textAlign: "left", padding: "8px 20px", fontWeight: 600, color: MUTED, fontSize: 12 }}>Linked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.children.map(c => (
                      <tr key={c.actorId} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                        onClick={() => navigate(`/students/${c.actorId}`)}
                        onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                        <td style={{ padding: "10px 20px", fontWeight: 500, color: "#0f172a" }}>{c.name}</td>
                        <td style={{ padding: "10px 20px", color: MUTED, fontFamily: "monospace" }}>{c.studentId || "—"}</td>
                        <td style={{ padding: "10px 20px", color: MUTED, textTransform: "capitalize" }}>{c.relationship}</td>
                        <td style={{ padding: "10px 20px" }}>
                          {c.isPrimary ? <span style={{ color: "#166534", fontWeight: 600 }}>Yes</span> : <span style={{ color: MUTED }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 20px", color: MUTED, fontSize: 13 }}>{c.linkedAt ? new Date(c.linkedAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
