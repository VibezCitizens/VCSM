import { useState } from "react";

export default function CreateTenantForm({ isSaving, error, onCreate }) {
  const [schoolName, setSchoolName] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [principalEmail, setPrincipalEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f4a72");

  const canSubmit = !isSaving && schoolName.trim() && principalEmail.trim();

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({ principalEmail, schoolName, schoolSlug, primaryColor }).then(
      (result) => {
        if (result?.ok) {
          setSchoolName("");
          setSchoolSlug("");
          setPrincipalEmail("");
          setPrimaryColor("#0f4a72");
        }
      },
    );
  }

  return (
    <form className="sa-form" onSubmit={handleSubmit}>
      <h3 className="sa-form-title">Create New Tenant</h3>

      {error && (
        <div className="sa-error-box" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {error.message ?? error.code ?? "An error occurred"}
          </div>
          <pre className="sa-error-detail">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}

      <div className="sa-form-row">
        <div className="sa-form-group grow">
          <label className="sa-label">School / Tenant Name *</label>
          <input
            className="sa-input"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="e.g. Springfield High School"
            required
          />
        </div>
        <div className="sa-form-group medium">
          <label className="sa-label">
            Slug <span style={{ opacity: 0.5, fontWeight: 400 }}>(auto if blank)</span>
          </label>
          <input
            className="sa-input"
            value={schoolSlug}
            onChange={(e) => setSchoolSlug(e.target.value)}
            placeholder="springfield-high"
            style={{ fontFamily: "monospace" }}
          />
        </div>
      </div>

      <div className="sa-form-row">
        <div className="sa-form-group grow">
          <label className="sa-label">Principal Email *</label>
          <input
            className="sa-input"
            type="email"
            value={principalEmail}
            onChange={(e) => setPrincipalEmail(e.target.value)}
            placeholder="admin@springfield-high.edu"
            required
          />
        </div>
        <div className="sa-form-group compact">
          <label className="sa-label">Primary Color</label>
          <div className="sa-color-picker">
            <input
              type="color"
              className="sa-color-swatch"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
            <input
              className="sa-color-hex"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#0f4a72"
            />
          </div>
        </div>
        <button type="submit" className="sa-btn-submit" disabled={!canSubmit}>
          {isSaving ? "Creating..." : "Create Tenant"}
        </button>
      </div>
    </form>
  );
}
