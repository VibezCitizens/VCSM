import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { createStudent } from "@/features/services/supabase/createStudent";
import { refreshLearningActorDirectory } from "@/features/identity/dal/refreshActorDirectory.dal";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${BORDER}`, fontSize: 14,
  background: "#fff", color: "#0f172a", boxSizing: "border-box",
};

const GRADE_LEVELS = [
  "Pre-K", "Kindergarten",
  "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade",
  "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade",
];

const RELATIONSHIPS = [
  "Mother", "Father", "Stepmother", "Stepfather",
  "Grandmother", "Grandfather", "Aunt", "Uncle",
  "Legal Guardian", "Foster Parent", "Other",
];

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
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {children}
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function RegisterStudentScreen() {
  const navigate = useNavigate();

  // Auth + org context
  const [org, setOrg] = useState(null);
  const [actorId, setActorId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student Info
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");

  // Guardian Info
  const [guardianFirstName, setGuardianFirstName] = useState("");
  const [guardianLastName, setGuardianLastName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");


  // Submit
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Load auth context
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login", { replace: true }); return; }

      const { data: actor } = await supabase.schema("learning").from("actors")
        .select("id, organization_id").eq("user_id", user.id).eq("is_active", true).maybeSingle();

      if (!actor) { navigate("/dashboard", { replace: true }); return; }
      setActorId(actor.id);

      const { data: membership } = await supabase.schema("learning").from("organization_memberships")
        .select("organization_id").eq("actor_id", actor.id).eq("status", "active").limit(1).maybeSingle();

      if (!membership) { navigate("/dashboard", { replace: true }); return; }

      const { data: orgRow } = await supabase.schema("learning").from("organizations")
        .select("id, name, slug").eq("id", membership.organization_id).maybeSingle();

      setOrg(orgRow);
      setLoading(false);
    }
    init();
  }, [navigate]);


  function buildFullName() {
    return [firstName, middleName, lastName, secondLastName].map(s => s.trim()).filter(Boolean).join(" ");
  }

  const canSubmit = firstName.trim() && lastName.trim() && gradeLevel
    && guardianFirstName.trim() && guardianLastName.trim()
    && relationship && guardianEmail.trim() && !saving;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");
    setResult(null);

    try {
      const res = await createStudent({
        organizationId: org.id,
        courseIds: [],
        displayName: buildFullName(),
        parentName: [guardianFirstName, guardianLastName].map(s => s.trim()).filter(Boolean).join(" "),
        parentEmail: guardianEmail.trim(),
      });

      if (!res.ok) {
        setError(res.error?.message ?? "Registration failed.");
        setSaving(false);
        return;
      }

      // Save extended profile fields (actor_profiles for profile data only)
      if (res.data?.studentActorId) {
        await supabase.schema("learning").from("actor_profiles").upsert({
          actor_id: res.data.studentActorId,
          full_name: buildFullName(),
          first_name: firstName.trim(),
          middle_name: middleName.trim() || null,
          last_name: lastName.trim(),
          second_last_name: secondLastName.trim() || null,
          preferred_name: preferredName.trim() || null,
          sex: sex || null,
          date_of_birth: dateOfBirth || null,
          grade_level: gradeLevel,
          section: section.trim() || null,
          student_id: res.data.loginId,
          relationship_to_student: relationship,
          guardian_phone: guardianPhone.trim() || null,
        }, { onConflict: "actor_id" });

        // Refresh actor directory projection (non-fatal)
        refreshLearningActorDirectory(res.data.studentActorId)
      }

      setResult(res.data);
    } catch (err) {
      setError(err?.message ?? "Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: MUTED }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      {/* Top bar */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 32px", background: "#fff", borderBottom: `1px solid ${BORDER}`,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: PRIMARY, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>L</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>{org?.name ?? "Organization"}</div>
            <div style={{ fontSize: 12, color: MUTED }}>Student Registration</div>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 13, cursor: "pointer" }}
        >
          Back to Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Page header */}
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 }}>
            Administration
          </span>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            Register New Student
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 15, color: MUTED, lineHeight: 1.5 }}>
            Create a school-managed student account. A Student ID and temporary password
            will be generated automatically.
          </p>
        </div>

        {/* Success state */}
        {result && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14,
            padding: 28, display: "flex", flexDirection: "column", gap: 16,
          }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#166534" }}>
              Student Registered Successfully
            </h3>
            <div style={{
              background: "#fff", border: "1px solid #dcfce7", borderRadius: 10,
              padding: 20, fontFamily: "monospace", fontSize: 14, lineHeight: 2,
              color: "#166534", userSelect: "all",
            }}>
              <div>Student: <strong>{buildFullName()}</strong></div>
              <div>Student ID: <strong>{result.loginId}</strong></div>
              <div>Temporary Password: <strong>{result.generatedPassword}</strong></div>

              <div>Guardian: <strong>{guardianFirstName} {guardianLastName}</strong></div>
              <div>Guardian Email: <strong>{guardianEmail}</strong></div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>
              The student must change their password on first login. Share these credentials with the guardian.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  const doc = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Student Credentials - ${result.loginId}</title>
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
    <h1>${org?.name ?? "School"}</h1>
    <p>Student Login Credentials</p>
  </div>
  <table>
    <tr><td colspan="2" class="section-title">Student Information</td></tr>
    <tr><td class="label">Full Name</td><td class="value">${buildFullName()}</td></tr>
    <tr><td class="label">Student ID</td><td class="value"><span class="highlight">${result.loginId}</span></td></tr>
    <tr><td class="label">Temporary Password</td><td class="value"><span class="highlight">${result.generatedPassword}</span></td></tr>
    <tr><td colspan="2" class="section-title">Guardian Information</td></tr>
    <tr><td class="label">Guardian Name</td><td class="value">${guardianFirstName} ${guardianLastName}</td></tr>
    <tr><td class="label">Guardian Email</td><td class="value">${guardianEmail}</td></tr>
    ${guardianPhone ? `<tr><td class="label">Guardian Phone</td><td class="value">${guardianPhone}</td></tr>` : ""}
  </table>
  <div class="warning">The student must change their password on first login.<br>Please share these credentials securely with the guardian.</div>
  <div class="footer">Generated on ${new Date().toLocaleDateString()} &middot; ${org?.name ?? "WENTREX"}</div>
</div>
<button class="print-btn no-print" onclick="window.print()">Print This Page</button>
</body></html>`;
                  const blob = new Blob([doc], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `credentials-${result.loginId}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ padding: "10px 22px", borderRadius: 10, border: "1px solid #166534", background: "#fff", color: "#166534", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Download Credentials
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                style={{ padding: "10px 22px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setFirstName(""); setMiddleName(""); setLastName(""); setSecondLastName("");
                  setPreferredName(""); setDateOfBirth(""); setSex(""); setGradeLevel(""); setSection("");
                  setGuardianFirstName(""); setGuardianLastName(""); setRelationship("");
                  setGuardianEmail(""); setGuardianPhone("");
                }}
                style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: PRIMARY, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Register Another Student
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Section 1: Student Information */}
            <SectionCard title="Student Information" subtitle="Basic identity and academic placement.">
              <FieldRow>
                <Field label="First Name" required>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Juan" required style={inputStyle} />
                </Field>
                <Field label="Middle Name">
                  <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="e.g. Carlos" style={inputStyle} />
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="Last Name" required>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Rodriguez" required style={inputStyle} />
                </Field>
                <Field label="Second Last Name">
                  <input type="text" value={secondLastName} onChange={e => setSecondLastName(e.target.value)} placeholder="e.g. Martinez" style={inputStyle} />
                </Field>
              </FieldRow>

              <Field label="Preferred Name" help="What the student prefers to be called in class.">
                <input type="text" value={preferredName} onChange={e => setPreferredName(e.target.value)} placeholder="e.g. Juanito" style={inputStyle} />
              </Field>

              <FieldRow>
                <Field label="Date of Birth">
                  <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Sex">
                  <select value={sex} onChange={e => setSex(e.target.value)} style={inputStyle}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="Grade Level" required>
                  <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required style={inputStyle}>
                    <option value="">Select grade...</option>
                    {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Section / Group" help="e.g. Section A, Group 3">
                  <input type="text" value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. Section A" style={inputStyle} />
                </Field>
              </FieldRow>
            </SectionCard>

            {/* Section 2: Guardian Information */}
            <SectionCard title="Guardian Information" subtitle="Primary parent or guardian contact for this student.">
              <FieldRow>
                <Field label="Guardian First Name" required>
                  <input type="text" value={guardianFirstName} onChange={e => setGuardianFirstName(e.target.value)} placeholder="e.g. Maria" required style={inputStyle} />
                </Field>
                <Field label="Guardian Last Name" required>
                  <input type="text" value={guardianLastName} onChange={e => setGuardianLastName(e.target.value)} placeholder="e.g. Rodriguez" required style={inputStyle} />
                </Field>
              </FieldRow>

              <Field label="Relationship to Student" required>
                <select value={relationship} onChange={e => setRelationship(e.target.value)} required style={inputStyle}>
                  <option value="">Select relationship...</option>
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              <FieldRow>
                <Field label="Guardian Email" required help="Credentials and password recovery will be sent here.">
                  <input type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} placeholder="parent@example.com" required style={inputStyle} />
                </Field>
                <Field label="Guardian Phone">
                  <input type="tel" value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
                </Field>
              </FieldRow>
            </SectionCard>

            {/* Section 3: School Account */}
            <SectionCard title="School Account" subtitle="Login credentials will be auto-generated.">
              <div style={{
                background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: 18, fontSize: 14, color: "#334155", lineHeight: 1.7,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: "#22c55e" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>School-managed identity</span>
                </div>
                <p style={{ margin: "0 0 6px" }}>A <strong>Student ID</strong> and <strong>temporary password</strong> will be generated when you submit this form.</p>
                <p style={{ margin: "0 0 6px" }}>The student will log in using their Student ID — no personal email required.</p>
                <p style={{ margin: 0 }}>The student will be required to <strong>change their password</strong> on first login.</p>
              </div>
            </SectionCard>

            {/* Error */}
            {error && (
              <div style={{ padding: "12px 18px", borderRadius: 10, background: "#fef2f2", color: "#7f1d1d", fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  padding: "12px 28px", borderRadius: 10, border: "none",
                  background: !canSubmit ? MUTED : PRIMARY, color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: !canSubmit ? "default" : "pointer",
                }}
              >
                {saving ? "Registering..." : "Register Student"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
