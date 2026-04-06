import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";
import SchoolAccountCard from "@/learning/components/SchoolAccountCard";

const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{value || "—"}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 24px" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
      {children}
    </div>
  );
}

export default function StudentDetailScreen() {
  const navigate = useNavigate();
  const { actorId } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [parentLinks, setParentLinks] = useState([]);

  const load = useCallback(async () => {
    // Profile
    const { data: profileRow } = await supabase.schema("learning").from("actor_profiles")
      .select("actor_id, full_name, first_name, middle_name, last_name, second_last_name, preferred_name, student_id, grade_level, section, sex, date_of_birth, guardian_phone, relationship_to_student, enrollment_status")
      .eq("actor_id", actorId).maybeSingle();
    setProfile(profileRow);

    // Identity
    const { data: identityRow, error: identityErr } = await supabase.schema("learning").from("actor_identities")
      .select("actor_id, login_id, synthetic_email, parent_email, parent_name, must_change_password, is_school_managed, organization_id")
      .eq("actor_id", actorId).maybeSingle();

    console.log("[StudentDetail] identity query", { actorId, identityRow, error: identityErr?.message ?? null });
    setIdentity(identityRow);

    // Org
    const { data: actor } = await supabase.schema("learning").from("actors")
      .select("organization_id").eq("id", actorId).maybeSingle();
    if (actor?.organization_id) {
      const { data: org } = await supabase.schema("learning").from("organizations")
        .select("name").eq("id", actor.organization_id).maybeSingle();
      setOrgName(org?.name ?? "");
    }

    // Parent links
    const { data: links } = await supabase.schema("learning").from("parent_student_links")
      .select("id, parent_actor_id, relationship, is_primary, created_at")
      .eq("student_actor_id", actorId);

    if (links?.length) {
      const parentIds = links.map(l => l.parent_actor_id);
      const { data: parentProfiles } = await supabase.schema("learning").from("actor_profiles")
        .select("actor_id, full_name").in("actor_id", parentIds);
      const pm = new Map((parentProfiles ?? []).map(p => [p.actor_id, p]));
      setParentLinks(links.map(l => ({ ...l, profile: pm.get(l.parent_actor_id) })));
    }

    setLoading(false);
  }, [actorId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName={orgName} subtitle="Student Detail" backTo="/students" backLabel="Students" />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 64px", display: "flex", flexDirection: "column", gap: 20 }}>

        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          {profile?.full_name ?? "Student"}
        </h1>

        {/* Profile */}
        <Card title="Student Profile">
          <InfoRow label="Full Name" value={profile?.full_name} />
          <InfoRow label="Student ID" value={profile?.student_id} />
          <InfoRow label="First Name" value={profile?.first_name} />
          <InfoRow label="Middle Name" value={profile?.middle_name} />
          <InfoRow label="Last Name" value={profile?.last_name} />
          <InfoRow label="Grade Level" value={profile?.grade_level} />
          <InfoRow label="Section" value={profile?.section} />
          <InfoRow label="Sex" value={profile?.sex} />
          <InfoRow label="Date of Birth" value={profile?.date_of_birth} />
          <InfoRow label="Status" value={profile?.enrollment_status ?? "active"} />
        </Card>

        {/* School Account — admin can reset password */}
        <SchoolAccountCard
          identity={identity}
          actorId={actorId}
          studentName={profile?.full_name}
          canResetPassword={true}
          onRefresh={load}
        />

        {/* Guardian Contact */}
        <Card title="Guardian Contact">
          <InfoRow label="Guardian Name" value={identity?.parent_name} />
          <InfoRow label="Guardian Email" value={identity?.parent_email} />
          <InfoRow label="Guardian Phone" value={profile?.guardian_phone} />
          <InfoRow label="Relationship" value={profile?.relationship_to_student} />
        </Card>

        {/* Linked Parents */}
        <Card title="Linked Parents ({parentLinks.length})">
          {parentLinks.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 14 }}>No parents linked.</div>
          ) : (
            parentLinks.map(l => (
              <div key={l.id} style={{ padding: "10px 0", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{l.profile?.full_name ?? l.parent_actor_id.slice(0, 8)}</span>
                  <span style={{ marginLeft: 10, fontSize: 13, color: MUTED }}>{l.relationship}</span>
                  {l.is_primary && <span style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: "#dcfce7", color: "#166534" }}>Primary</span>}
                </div>
                <span style={{ fontSize: 12, color: MUTED }}>{l.created_at ? new Date(l.created_at).toLocaleDateString() : ""}</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
