import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { useWentrexActorId } from "@/features/identity/WentrexIdentityContext";
import { refreshLearningActorDirectory } from "@/features/identity/dal/refreshActorDirectory.dal";
import { ctrlSendResetPasswordEmail } from "@/auth/controllers/sendResetPassword.controller";
import TopBar from "@/learning/components/TopBar";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
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

export default function ParentSettingsScreen() {
  const navigate = useNavigate();
  const { actorId, organizationId, loading: identityLoading } = useWentrexActorId();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [profile, setProfile] = useState(null);
  const [actorMeta, setActorMeta] = useState(null);
  const [access, setAccess] = useState(null);
  const [children, setChildren] = useState([]);

  // Editable fields
  const [phone, setPhone] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!actorId) { navigate("/login", { replace: true }); return; }

    const { data: { session } } = await supabase.auth.getSession();
    setUserName(session?.user?.email ?? "");

    // Org name
    if (organizationId) {
      const { data: org } = await supabase.schema("learning").from("organizations")
        .select("name").eq("id", organizationId).maybeSingle();
      setOrgName(org?.name ?? "");
    }

    // Actor display metadata
    const { data: actorMetaRow } = await supabase.schema("learning").from("actors")
      .select("is_active, created_at").eq("id", actorId).maybeSingle();
    setActorMeta(actorMetaRow);

    // Profile
    const { data: profileRow } = await supabase.schema("learning").from("actor_profiles")
      .select("full_name, first_name, last_name, preferred_name, display_name, phone, alternate_email, avatar_url")
      .eq("actor_id", actorId).maybeSingle();
    setProfile(profileRow);
    setPhone(profileRow?.phone ?? "");
    setPreferredName(profileRow?.preferred_name ?? "");

    // Access
    const { data: accessRow } = await supabase.schema("learning").from("actor_access")
      .select("can_access_learning_center, revoked_at, granted_at")
      .eq("actor_id", actorId).maybeSingle();
    setAccess(accessRow);

    // Children
    const { data: links } = await supabase.schema("learning").from("parent_student_links")
      .select("id, student_actor_id, relationship, is_primary, created_at")
      .eq("parent_actor_id", actorId);

    if (links?.length) {
      const studentIds = links.map(l => l.student_actor_id);
      const { data: profiles } = await supabase.schema("learning").from("actor_profiles")
        .select("actor_id, full_name, student_id, grade_level, section")
        .in("actor_id", studentIds);
      const pm = new Map((profiles ?? []).map(p => [p.actor_id, p]));
      setChildren(links.map(l => ({ ...l, profile: pm.get(l.student_actor_id) })));
    }

    setLoading(false);
  }, [actorId, organizationId, navigate]);

  useEffect(() => { if (!identityLoading) load(); }, [identityLoading, load]);

  async function handleSaveContact() {
    if (!actorId) return;
    setSaving(true); setSaved(false);
    await supabase.schema("learning").from("actor_profiles").upsert({
      actor_id: actorId,
      full_name: profile?.full_name ?? userName,
      phone: phone.trim() || null,
      preferred_name: preferredName.trim() || null,
    }, { onConflict: "actor_id" });
    refreshLearningActorDirectory(actorId)
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  const isActive = access?.can_access_learning_center === true && !access?.revoked_at;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName={orgName} subtitle="Settings" userName={userName} role="parent" backTo="/parent" backLabel="Dashboard" />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 64px", display: "flex", flexDirection: "column", gap: 20 }}>

        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Parent Settings</span>
          <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>My Account</h1>
        </div>

        {/* My Profile */}
        <Card title="My Profile">
          <InfoRow label="Full Name" value={profile?.full_name} />
          <InfoRow label="First Name" value={profile?.first_name} />
          <InfoRow label="Last Name" value={profile?.last_name} />
          <InfoRow label="Display Name" value={profile?.display_name} />
          <InfoRow label="Email" value={userName} />
        </Card>

        {/* Contact — editable */}
        <Card title="Contact Information">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 4 }}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 4 }}>Preferred Name</label>
              <input type="text" value={preferredName} onChange={e => setPreferredName(e.target.value)} placeholder="What you'd like to be called"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={handleSaveContact} disabled={saving}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && <span style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>Saved</span>}
            </div>
          </div>
        </Card>

        {/* Linked Children */}
        <Card title="Linked Children">
          {children.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 14, padding: "8px 0" }}>No children linked to your account.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {children.map(child => (
                <div key={child.id} style={{ background: SURFACE, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{child.profile?.full_name ?? "Student"}</span>
                    {child.is_primary && <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: "#dcfce7", color: "#166534" }}>Primary</span>}
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 13, color: MUTED, flexWrap: "wrap" }}>
                    {child.profile?.student_id && <span>ID: <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{child.profile.student_id}</strong></span>}
                    {child.profile?.grade_level && <span>{child.profile.grade_level}</span>}
                    {child.profile?.section && <span>Sec. {child.profile.section}</span>}
                    <span>{child.relationship}</span>
                    <span>Since {child.created_at ? new Date(child.created_at).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Account & Access */}
        <Card title="Account & Access">
          <InfoRow label="Account Status" value={actorMeta?.is_active ? "Active" : "Inactive"} />
          <InfoRow label="Learning Portal" value={isActive ? "Enabled" : "Disabled"} />
          <InfoRow label="School" value={orgName || "—"} />
          <InfoRow label="Linked Children" value={children.length} />
          <InfoRow label="Member Since" value={actorMeta?.created_at ? new Date(actorMeta.created_at).toLocaleDateString() : "—"} />
        </Card>

        {/* Security */}
        <Card title="Security">
          <p style={{ margin: "0 0 12px", fontSize: 14, color: MUTED }}>
            To change your password, use the reset link below. A password reset email will be sent to your registered email address.
          </p>
          <button
            onClick={async () => {
              await ctrlSendResetPasswordEmail(userName);
              alert("Password reset email sent to " + userName);
            }}
            style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer" }}>
            Send Password Reset Email
          </button>
        </Card>
      </div>
    </div>
  );
}
