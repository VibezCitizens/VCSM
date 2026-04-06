import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import TopBar from "@/learning/components/TopBar";
import StudentPicker from "@/learning/administration/components/StudentPicker";
import { createParent } from "@/features/services/supabase/createParent";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${BORDER}`, fontSize: 14,
  background: "#fff", color: "#0f172a", boxSizing: "border-box",
};

function Field({ label, required, children, help }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      {children}
      {help && <span style={{ fontSize: 12, color: MUTED }}>{help}</span>}
    </div>
  );
}

function FieldRow({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const RELATIONSHIPS = ["mother", "father", "guardian", "parent"];

export default function LinkParentScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [actorId, setActorId] = useState(null);
  const [existingLinks, setExistingLinks] = useState([]);

  // Form
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login", { replace: true }); return; }

    const { data: actor } = await supabase.schema("learning").from("actors")
      .select("id, organization_id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (!actor) { navigate("/dashboard", { replace: true }); return; }
    setActorId(actor.id);

    const { data: mem } = await supabase.schema("learning").from("organization_memberships")
      .select("organization_id").eq("actor_id", actor.id).eq("status", "active").limit(1).maybeSingle();
    if (!mem) { navigate("/dashboard", { replace: true }); return; }

    const { data: org } = await supabase.schema("learning").from("organizations")
      .select("id, name").eq("id", mem.organization_id).maybeSingle();
    setOrgId(org?.id); setOrgName(org?.name ?? "");

    // Load existing links
    const { data: links } = await supabase.schema("learning").from("parent_student_links")
      .select("id, parent_actor_id, student_actor_id, relationship, is_primary, created_at")
      .eq("organization_id", org?.id).order("created_at", { ascending: false });
    setExistingLinks(links ?? []);

    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedStudent?.actor_id || !parentFirstName.trim() || !parentLastName.trim() || !parentEmail.trim() || !relationship) return;

    setSaving(true); setError(""); setResult(null);

    try {
      const fullName = `${parentFirstName.trim()} ${parentLastName.trim()}`;

      const res = await createParent({
        organizationId: orgId,
        studentActorId: selectedStudent?.actor_id,
        displayName: fullName,
        email: parentEmail.trim(),
        relationship,
        isPrimary,
      });

      if (!res.ok) {
        setError(res.error?.message ?? "Failed to link parent.");
        setSaving(false);
        return;
      }

      setResult({
        parentName: fullName,
        parentEmail: parentEmail.trim(),
        studentName: selectedStudent?.full_name ?? "Student",
        relationship,
        generatedPassword: res.data?.generatedPassword ?? null,
        createdNewUser: res.data?.createdNewUser ?? false,
      });

      await load();
    } catch (err) {
      setError(err?.message ?? "Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>Loading...</div>;

  const selectedStudentLinks = existingLinks.filter(l => l.student_actor_id === selectedStudent?.actor_id);

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar orgName={orgName} subtitle="Link Parent to Student" backTo="/dashboard" backLabel="Dashboard" />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px", display: "flex", flexDirection: "column", gap: 24 }}>

        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>Administration</span>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Link Parent to Student</h1>
          <p style={{ margin: "8px 0 0", fontSize: 15, color: MUTED }}>
            Create a parent account and link it to a student. Each student can have up to 2 linked parents.
          </p>
        </div>

        {/* Success */}
        {result && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#166534" }}>Parent Linked Successfully</h3>
            <div style={{ background: "#fff", border: "1px solid #dcfce7", borderRadius: 10, padding: 20, fontFamily: "monospace", fontSize: 14, lineHeight: 2, color: "#166534", userSelect: "all" }}>
              <div>Parent: <strong>{result.parentName}</strong></div>
              <div>Email: <strong>{result.parentEmail}</strong></div>
              <div>Student: <strong>{result.studentName}</strong></div>
              <div>Relationship: <strong>{result.relationship}</strong></div>
              {result.createdNewUser && result.generatedPassword && (
                <div>Password: <strong>{result.generatedPassword}</strong></div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {result.createdNewUser && result.generatedPassword && (
                <button
                  onClick={() => {
                    const doc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Parent Credentials</title>
<style>
  @media print { body { margin: 0; padding: 20px; } .no-print { display: none !important; } }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; background: #f8fafc; margin: 0; }
  .card { border: 2px solid #cbd5e1; border-radius: 16px; padding: 40px; max-width: 520px; margin: 0 auto; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .logo { width: 44px; height: 44px; border-radius: 12px; background: #0f4a72; color: #fff; font-weight: 800; font-size: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
  .header { text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
  .header h1 { margin: 0 0 4px; font-size: 22px; color: #0f4a72; font-weight: 800; }
  .header p { margin: 0; font-size: 14px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 12px 0; font-size: 15px; vertical-align: top; }
  td.label { color: #64748b; width: 180px; padding-right: 20px; white-space: nowrap; }
  td.value { font-weight: 700; color: #0f172a; word-break: break-all; }
  tr { border-bottom: 1px solid #f1f5f9; }
  tr:last-child { border-bottom: none; }
  .highlight { background: #f0fdf4; border-radius: 6px; padding: 2px 8px; color: #166534; font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 1px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0f4a72; padding: 18px 0 6px; border-bottom: none; }
  .warning { margin-top: 24px; padding: 14px 18px; background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; font-size: 13px; color: #854d0e; text-align: center; line-height: 1.5; }
  .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; }
  .print-btn { display: block; margin: 24px auto 0; padding: 12px 32px; background: #0f4a72; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
  .print-btn:hover { background: #1a6ba0; }
</style></head><body>
<div class="card">
  <div class="header">
    <div class="logo">L</div>
    <h1>${orgName || "School"}</h1>
    <p>Parent Login Credentials</p>
  </div>
  <table>
    <tr><td colspan="2" class="section-title">Parent Account</td></tr>
    <tr><td class="label">Parent Name</td><td class="value">${result.parentName}</td></tr>
    <tr><td class="label">Email</td><td class="value"><span class="highlight">${result.parentEmail}</span></td></tr>
    <tr><td class="label">Temporary Password</td><td class="value"><span class="highlight">${result.generatedPassword}</span></td></tr>
    <tr><td colspan="2" class="section-title">Linked Student</td></tr>
    <tr><td class="label">Student Name</td><td class="value">${result.studentName}</td></tr>
    <tr><td class="label">Relationship</td><td class="value">${result.relationship}</td></tr>
  </table>
  <div class="warning">Please share these credentials securely with the parent.<br>They can change their password after first login.</div>
  <div class="footer">Generated on ${new Date().toLocaleDateString()} &middot; ${orgName || "WENTREX"}</div>
</div>
<button class="print-btn no-print" onclick="window.print()">Print This Page</button>
</body></html>`;
                    const blob = new Blob([doc], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `parent-credentials-${result.parentEmail.split("@")[0]}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ padding: "10px 22px", borderRadius: 10, border: "1px solid #166534", background: "#fff", color: "#166534", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Download Credentials
                </button>
              )}
              <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 22px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}>Dashboard</button>
              <button onClick={() => { setResult(null); setParentFirstName(""); setParentLastName(""); setParentEmail(""); setParentPhone(""); setRelationship(""); setSelectedStudent(null); setIsPrimary(false); }}
                style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: PRIMARY, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Link Another Parent
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            <SectionCard title="Find Student" subtitle="Search by Student ID or browse by last name.">
              <StudentPicker
                organizationId={orgId}
                selected={selectedStudent}
                onSelect={setSelectedStudent}
                existingLinks={existingLinks}
              />
            </SectionCard>

            <SectionCard title="Parent Information" subtitle="Enter the parent or guardian's details.">
              <FieldRow>
                <Field label="First Name" required>
                  <input type="text" value={parentFirstName} onChange={e => setParentFirstName(e.target.value)} placeholder="e.g. Maria" required style={inputStyle} />
                </Field>
                <Field label="Last Name" required>
                  <input type="text" value={parentLastName} onChange={e => setParentLastName(e.target.value)} placeholder="e.g. Rodriguez" required style={inputStyle} />
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="Email" required help="The parent will use this to log in.">
                  <input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="parent@example.com" required style={inputStyle} />
                </Field>
                <Field label="Phone">
                  <input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="Relationship" required>
                  <select value={relationship} onChange={e => setRelationship(e.target.value)} required style={inputStyle}>
                    <option value="">Select...</option>
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Primary Contact">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", paddingTop: 8 }}>
                    <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} style={{ width: 16, height: 16 }} />
                    This is the primary parent/guardian
                  </label>
                </Field>
              </FieldRow>
            </SectionCard>

            {error && <div style={{ padding: "12px 18px", borderRadius: 10, background: "#fef2f2", color: "#7f1d1d", fontSize: 14 }}>{error}</div>}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
              <button type="button" onClick={() => navigate("/dashboard")} style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button type="submit"
                disabled={saving || !selectedStudent?.actor_id || !parentFirstName.trim() || !parentLastName.trim() || !parentEmail.trim() || !relationship || selectedStudentLinks.length >= 2}
                style={{
                  padding: "12px 28px", borderRadius: 10, border: "none",
                  background: saving || selectedStudentLinks.length >= 2 ? MUTED : PRIMARY, color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: saving ? "default" : "pointer",
                }}>
                {saving ? "Linking..." : "Link Parent"}
              </button>
            </div>
          </form>
        )}

        {/* Existing Links */}
        {existingLinks.length > 0 && !result && (
          <SectionCard title="Existing Parent Links" subtitle={`${existingLinks.length} link${existingLinks.length !== 1 ? "s" : ""} in this organization.`}>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Parent</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Student</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Relationship</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: MUTED }}>Primary</th>
                </tr></thead>
                <tbody>{existingLinks.map(l => {
                  const student = null;
                  return (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "10px 16px", color: "#0f172a", fontFamily: "monospace", fontSize: 12 }}>{l.parent_actor_id.slice(0, 8)}</td>
                      <td style={{ padding: "10px 16px", color: "#0f172a" }}>{student?.profile?.full_name ?? student?.login_id ?? l.student_actor_id.slice(0, 8)}</td>
                      <td style={{ padding: "10px 16px", color: MUTED }}>{l.relationship}</td>
                      <td style={{ padding: "10px 16px" }}>{l.is_primary ? <span style={{ color: "#166534", fontWeight: 600 }}>Yes</span> : "—"}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
