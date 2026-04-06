import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function RoleBadge({ role }) {
  const c = { owner: { bg: "#fce7f3", color: "#9d174d" }, admin: { bg: "#ede9fe", color: "#5b21b6" }, staff: { bg: "#e0f2fe", color: "#0369a1" }, teacher: { bg: "#dcfce7", color: "#166534" } }[role] ?? { bg: "#f1f5f9", color: MUTED };
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>{role ?? "—"}</span>;
}

export default function StaffScreen() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
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

    const { data: rows } = await supabase.schema("learning").from("organization_memberships")
      .select("id, actor_id, role, status, created_at").eq("organization_id", org?.id).eq("status", "active").order("created_at", { ascending: false });

    // Hydrate with profile names
    const actorIds = (rows ?? []).map(r => r.actor_id);
    let profileMap = new Map();
    if (actorIds.length > 0) {
      // Try learning.actor_profiles first
      const { data: lmsProfiles } = await supabase.schema("learning").from("actor_profiles").select("actor_id, full_name, display_name").in("actor_id", actorIds);
      for (const p of lmsProfiles ?? []) profileMap.set(p.actor_id, p);

      // For any actors without LMS profiles, look up via actors -> public.profiles
      const missing = actorIds.filter(id => !profileMap.has(id));
      if (missing.length > 0) {
        const { data: actors } = await supabase.schema("learning").from("actors").select("id, user_id").in("id", missing);
        const userIds = (actors ?? []).map(a => a.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: pubProfiles } = await supabase.from("profiles").select("id, display_name, email, username").in("id", userIds);
          const userToActor = new Map((actors ?? []).map(a => [a.user_id, a.id]));
          for (const p of pubProfiles ?? []) {
            const actorId = userToActor.get(p.id);
            if (actorId && !profileMap.has(actorId)) {
              profileMap.set(actorId, { actor_id: actorId, full_name: p.display_name ?? p.username ?? p.email ?? null, display_name: p.display_name });
            }
          }
        }
      }
    }

    setMembers((rows ?? []).map(r => ({ ...r, profile: profileMap.get(r.actor_id) ?? null })));
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 32px", background: "#fff", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: PRIMARY, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>L</div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>{orgName}</div><div style={{ fontSize: 12, color: MUTED }}>Staff & Teachers</div></div>
        </div>
        <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer" }}>Dashboard</button>
      </nav>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div><span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Administration</span><h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Staff & Teachers ({members.length})</h1></div>
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          {members.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: MUTED }}>No staff members yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Name</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Role</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Status</th>
                <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: MUTED }}>Added</th>
              </tr></thead>
              <tbody>{members.map(m => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${BORDER}` }} onMouseEnter={e => { e.currentTarget.style.background = SURFACE; }} onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: "#0f172a" }}>{m.profile?.full_name ?? m.profile?.display_name ?? m.actor_id}</td>
                  <td style={{ padding: "14px 20px" }}><RoleBadge role={m.role} /></td>
                  <td style={{ padding: "14px 20px", color: MUTED }}>{m.status}</td>
                  <td style={{ padding: "14px 20px", color: MUTED }}>{m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
