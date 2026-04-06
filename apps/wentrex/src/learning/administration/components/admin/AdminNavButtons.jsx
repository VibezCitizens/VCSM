import React from "react";

const navButtonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #222",
  background: "#fff",
  color: "#222",
  cursor: "pointer",
};

export function AdminNavButtons({
  onOpenStudentDashboard,
  onOpenParentDashboard,
  onOpenTeacherDashboard,
  onOpenAccessManagement,
  onOpenPlatformAdmins,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 24,
      }}
    >
      <button type="button" onClick={onOpenStudentDashboard} style={navButtonStyle}>
        Students
      </button>

      <button type="button" onClick={onOpenParentDashboard} style={navButtonStyle}>
        Parents
      </button>

      <button type="button" onClick={onOpenTeacherDashboard} style={navButtonStyle}>
        Teachers
      </button>

      <button type="button" onClick={onOpenAccessManagement} style={navButtonStyle}>
        Access Management
      </button>

      <button type="button" onClick={onOpenPlatformAdmins} style={navButtonStyle}>
        Platform Admins
      </button>
    </div>
  );
}
