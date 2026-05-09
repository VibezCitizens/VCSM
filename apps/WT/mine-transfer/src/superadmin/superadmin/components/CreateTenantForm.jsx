import React, { useState } from "react";

export function CreateTenantForm({ isSaving, error, onCreate }) {
  const [schoolName, setSchoolName] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [principalEmail, setPrincipalEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f4a72");

  const canSubmit = !isSaving && schoolName.trim() && principalEmail.trim();

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({ principalEmail, schoolName, schoolSlug, primaryColor }).then((result) => {
      if (result?.ok) {
        setSchoolName("");
        setSchoolSlug("");
        setPrincipalEmail("");
        setPrimaryColor("#0f4a72");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        marginBottom: 32,
      }}
    >
      <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>
        Create New Tenant
      </h3>

      {error && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 8,
            background: "#fef3f2",
            color: "#b42318",
            border: "1px solid #fecdca",
            fontSize: 14,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {error.message ?? error.code ?? "An error occurred"}
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "#7f1d1d",
            }}
          >
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            School / Tenant Name *
          </label>
          <input
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="e.g. Springfield High School"
            required
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Slug{" "}
            <span style={{ color: "#9ca3af", fontWeight: 400 }}>(auto-generated if blank)</span>
          </label>
          <input
            value={schoolSlug}
            onChange={(e) => setSchoolSlug(e.target.value)}
            placeholder="springfield-high"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Principal Email *
          </label>
          <input
            type="email"
            value={principalEmail}
            onChange={(e) => setPrincipalEmail(e.target.value)}
            placeholder="admin@springfield-high.edu"
            required
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 0, minWidth: 140 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Primary Color
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{ width: 40, height: 36, padding: 2, borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer" }}
            />
            <input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#0f4a72"
              style={{
                width: 90,
                padding: "9px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                boxSizing: "border-box",
                fontFamily: "monospace",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background: !canSubmit ? "#9ca3af" : "#0f4a72",
            color: "#fff",
            cursor: !canSubmit ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
            alignSelf: "flex-end",
          }}
        >
          {isSaving ? "Creating..." : "Create Tenant"}
        </button>
      </div>
    </form>
  );
}

export default CreateTenantForm;
