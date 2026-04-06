import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/learning/components/TopBar";

const PRIMARY = "#0f4a72";
const ACCENT = "#0ea5e9";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";
const SUCCESS = "#166534";
const SUCCESS_BG = "#dcfce7";
const WARN = "#854d0e";
const WARN_BG = "#fef9c3";

const STEPS = [
  {
    number: 1,
    title: "Add Your Staff",
    subtitle: "Teachers & Administrators",
    icon: "👥",
    color: "#6366f1",
    description: "Before you can create courses, you need teachers and staff members in your organization.",
    instructions: [
      'From the Dashboard, click "Enroll Staff"',
      "Enter the staff member's full name and email",
      "Select a role: Teacher, Staff, or Admin",
      'Click "Enroll"',
    ],
    important: 'Once the staff member is created, they can set their own password by clicking "Forgot Password" on the login page and entering their email. A password reset link will be sent to their inbox. If they don\'t see the email, ask them to check their Junk or Spam folder. The link can be requested again at any time if it expires or is lost.',
    tip: "You can add as many staff members as needed. Repeat for each teacher before creating courses.",
  },
  {
    number: 2,
    title: "Register Your Students",
    subtitle: "School-Managed Accounts",
    icon: "🎓",
    color: "#8b5cf6",
    description: "Create student accounts with auto-generated Student IDs and temporary passwords.",
    instructions: [
      'Go to Students → click "Register Student"',
      "Fill in: First Name, Last Name, Grade Level (required)",
      "Fill in guardian info: Name, Relationship, Email (required)",
      'Click "Register Student"',
      "Save the Student ID and Temporary Password shown on screen",
      'Click "Download Credentials" to save a printable card',
    ],
    important: 'Students log in using their Student ID — not an email address. They must change their password on first login. If a student forgets their password, a linked parent can reset it from their Parent Dashboard under Settings by clicking "Reset Student Password". A new temporary password will be generated and shown on screen. The student will be required to change it on their next login.',
    tip: "Give the printed credentials card to the student or parent. The temporary password will not be shown again.",
  },
  {
    number: 3,
    title: "Create Your Courses",
    subtitle: "Build Your Curriculum",
    icon: "📚",
    color: "#0ea5e9",
    description: "Set up courses for your organization. Courses start as drafts and can be published when ready.",
    instructions: [
      'Go to Courses → click "Create Course"',
      "Enter a Course Title (required)",
      "Optionally add a Course Code (e.g., BIO-101), description, and term",
      'Click "Create Course"',
    ],
    important: 'New courses start as Drafts. Once your teachers and students are assigned, go to the Courses list and click the "Publish" button next to the course you want to make active. Published courses become visible to enrolled teachers and students. If you need to take a course offline temporarily, click "Unpublish" to return it to Draft status. You can publish and unpublish at any time.',
    tip: null,
  },
  {
    number: 4,
    title: "Assign Teachers to Courses",
    subtitle: "Connect Instructors",
    icon: "🧑‍🏫",
    color: "#14b8a6",
    description: "A course needs at least one teacher before students can receive assignments.",
    instructions: [
      "Open a course from the Courses list",
      "Go to the Roster tab",
      'Click "Assign Teacher"',
      "Search for the teacher by name (they must already be added as staff in Step 1)",
      "Select the teaching role: Teacher, Instructor, TA, or Grader",
      'Click "Add Teacher"',
    ],
    important: "The teacher can now access the course from their Teacher Dashboard and begin creating content.",
    tip: "A course can have multiple teachers with different roles — for example, one lead teacher and one teaching assistant.",
  },
  {
    number: 5,
    title: "Enroll Students in Courses",
    subtitle: "Activate Student Access",
    icon: "✅",
    color: "#22c55e",
    description: "Students cannot see any courses until they are enrolled. This step activates their dashboard.",
    instructions: [
      "Open a course from the Courses list",
      "Go to the Roster tab",
      'Click "Add Student"',
      "Search for the student by Student ID or name",
      'Click to select, then click "Add Student"',
    ],
    important: "A student must be enrolled in at least one course to access their dashboard. Without enrollment, they will see a message asking them to contact their administrator.",
    tip: null,
  },
  {
    number: 6,
    title: "Link Parents to Students",
    subtitle: "Optional — Guardian Access",
    icon: "👨‍👩‍👧",
    color: "#f59e0b",
    description: "Parents get read-only access to see their child's courses, assignments, grades, and progress.",
    instructions: [
      'Go to "Link Parent" from the sidebar',
      "Search for the student by Student ID or browse by last name",
      "Select the student",
      "Enter parent name, email, relationship, and phone",
      'Click "Link Parent"',
    ],
    important: 'Each student can have up to 2 linked parents. Once a parent account is created, the parent can set their own password by clicking "Forgot Password" on the main login page and entering their email. A password reset link will be sent to their inbox. If they don\'t see the email, ask them to check their Junk or Spam folder. The link can be requested again at any time.',
    tip: "Parents log in with their email address at the main login page (not the Student Login).",
  },
  {
    number: 7,
    title: "Teachers Create Assignments",
    subtitle: "Content & Assessments",
    icon: "📝",
    color: "#ef4444",
    description: "Once a teacher is assigned to a course, they can create assignments, quizzes, and upload resources.",
    instructions: [
      "Teacher logs in and opens their course",
      'Clicks "Create Assignment"',
      "Fills in title, instructions, points, submission type, and due date",
      "Optionally attaches resources (URL or file upload)",
      "Optionally creates a quiz with multiple-choice, true/false, or short answer questions",
      'Clicks "Create Assignment" — it starts as a Draft',
      "Publishes it from the Assignments tab when ready for students",
    ],
    important: 'Draft assignments are invisible to students. To make an assignment visible, the teacher opens the course, goes to the Assignments tab, and clicks the "Publish" button next to the assignment. Once published, students will see it on their dashboard. If the teacher needs to make changes, they can click "Unpublish" to return it to Draft, edit it, and publish again when ready.',
    tip: null,
  },
];

const LOGIN_INFO = [
  { role: "Administrators & Teachers", method: "Email + password", where: "Main login page" },
  { role: "Students", method: "Student ID + password", where: "Student Login page" },
  { role: "Parents", method: "Email + password", where: "Main login page" },
];

function StepCard({ step, isOpen, onToggle }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${isOpen ? step.color : BORDER}`,
      borderRadius: 16,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${step.color}15`,
          display: "grid", placeItems: "center",
          fontSize: 22, flexShrink: 0,
        }}>
          {step.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: step.color,
              background: `${step.color}15`, padding: "2px 8px",
              borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              Step {step.number}
            </span>
            {step.number === 6 && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: WARN,
                background: WARN_BG, padding: "2px 8px", borderRadius: 6,
              }}>
                Optional
              </span>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{step.title}</div>
          <div style={{ fontSize: 13, color: MUTED }}>{step.subtitle}</div>
        </div>
        <span style={{
          fontSize: 20, color: MUTED, transition: "transform 0.2s",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, margin: "16px 0" }}>
            {step.description}
          </p>

          <div style={{
            background: SURFACE, borderRadius: 12, padding: "16px 20px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              How to do it
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {step.instructions.map((inst, i) => (
                <li key={i} style={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{inst}</li>
              ))}
            </ol>
          </div>

          {step.important && (
            <div style={{
              background: WARN_BG, border: "1px solid #fde68a",
              borderRadius: 10, padding: "12px 16px",
              fontSize: 13, color: WARN, lineHeight: 1.6,
              marginBottom: step.tip ? 12 : 0,
            }}>
              <strong>Important:</strong> {step.important}
            </div>
          )}

          {step.tip && (
            <div style={{
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 10, padding: "12px 16px",
              fontSize: 13, color: "#1e40af", lineHeight: 1.6,
            }}>
              <strong>Tip:</strong> {step.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SetupGuideScreen() {
  const navigate = useNavigate();
  const [openSteps, setOpenSteps] = useState(new Set([1]));

  function toggleStep(num) {
    setOpenSteps(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }

  function expandAll() {
    setOpenSteps(new Set(STEPS.map(s => s.number)));
  }

  function collapseAll() {
    setOpenSteps(new Set());
  }

  return (
    <div style={{ minHeight: "100vh", background: SURFACE }}>
      <TopBar
        orgName="Setup Guide"
        subtitle="Administrator Handbook"
        backTo="/dashboard"
        backLabel="Dashboard"
      />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: PRIMARY,
            display: "inline-grid", placeItems: "center",
            fontSize: 30, marginBottom: 16,
          }}>
            📖
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
            School Setup Guide
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: MUTED, maxWidth: 500, marginInline: "auto", lineHeight: 1.6 }}>
            Follow these steps in order to set up your school on the Wentrex Learning Platform.
            Each step depends on the one before it.
          </p>
        </div>

        {/* Order of Operations Banner */}
        <div style={{
          background: `linear-gradient(135deg, ${PRIMARY}, #1e3a5f)`,
          borderRadius: 16, padding: "24px 28px", marginBottom: 28,
          color: "#fff",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8, marginBottom: 14 }}>
            Required Order of Operations
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px 6px",
          }}>
            {["Staff", "Students", "Courses", "Teachers → Courses", "Students → Courses", "Parents (optional)", "Assignments"].map((label, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6,
                ...(i === 6 ? { gridColumn: "span 1" } : {}),
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px 12px", borderRadius: 8,
                  textAlign: "center", width: "100%",
                  whiteSpace: "nowrap",
                }}>
                  {i + 1}. {label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
            You cannot skip steps. A teacher cannot create assignments until assigned to a course.
            A student cannot see their dashboard until enrolled in at least one course.
          </div>
        </div>

        {/* Expand / Collapse */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
          <button onClick={expandAll} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
            background: "#fff", color: PRIMARY, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            Expand All
          </button>
          <button onClick={collapseAll} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
            background: "#fff", color: MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            Collapse All
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          {STEPS.map(step => (
            <StepCard
              key={step.number}
              step={step}
              isOpen={openSteps.has(step.number)}
              onToggle={() => toggleStep(step.number)}
            />
          ))}
        </div>

        {/* Login Information */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: 24, marginBottom: 28,
        }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Login Information
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700, color: PRIMARY, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Role</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700, color: PRIMARY, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Login Method</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700, color: PRIMARY, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Where</th>
                </tr>
              </thead>
              <tbody>
                {LOGIN_INFO.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{row.role}</td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>{row.method}</td>
                    <td style={{ padding: "12px 16px", color: MUTED }}>{row.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 8,
            background: SUCCESS_BG, fontSize: 13, color: SUCCESS, lineHeight: 1.6,
          }}>
            All new accounts require a password change on first login.
          </div>
        </div>

        {/* Back to Dashboard */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "12px 32px", borderRadius: 10, border: "none",
              background: PRIMARY, color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
