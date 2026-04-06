import React, { useState } from "react";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function TermRow({ term, onEdit }) {
  return (
    <tr>
      <td style={{ padding: "10px 12px" }}>{term.name}</td>
      <td style={{ padding: "10px 12px" }}>{formatDate(term.startsOn)}</td>
      <td style={{ padding: "10px 12px" }}>{formatDate(term.endsOn)}</td>
      <td style={{ padding: "10px 12px" }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: term.isActive ? "#dcfce7" : "#f1f5f9",
            color: term.isActive ? "#166534" : "#64748b",
          }}
        >
          {term.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <button
          type="button"
          onClick={() => onEdit(term)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Edit
        </button>
      </td>
    </tr>
  );
}

function TermForm({ initial = null, isSaving, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [startsOn, setStartsOn] = useState(initial?.startsOn ?? "");
  const [endsOn, setEndsOn] = useState(initial?.endsOn ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      name,
      startsOn: startsOn || null,
      endsOn: endsOn || null,
      isActive,
    });
  }

  const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#374151" };
  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>
        {initial ? "Edit Term" : "New Term"}
      </h4>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Name *</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Fall 2025"
          required
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Starts On</label>
          <input
            type="date"
            style={inputStyle}
            value={startsOn ?? ""}
            onChange={(e) => setStartsOn(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Ends On</label>
          <input
            type="date"
            style={inputStyle}
            value={endsOn ?? ""}
            onChange={(e) => setEndsOn(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span style={{ fontSize: 14 }}>Active</span>
        </label>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: isSaving || !name.trim() ? "#9ca3af" : "#111827",
            color: "#fff",
            cursor: isSaving || !name.trim() ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#374151",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CourseTermsPanel({ terms = [], isSaving, onCreateTerm, onUpdateTerm }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);

  function handleCreate(values) {
    onCreateTerm(values).then((result) => {
      if (result?.ok) setShowForm(false);
    });
  }

  function handleUpdate(values) {
    onUpdateTerm({ termId: editingTerm.id, ...values }).then((result) => {
      if (result?.ok) setEditingTerm(null);
    });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Terms ({terms.length})</h3>
        {!showForm && !editingTerm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "none",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + New Term
          </button>
        )}
      </div>

      {showForm && (
        <TermForm
          isSaving={isSaving}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingTerm && (
        <TermForm
          initial={editingTerm}
          isSaving={isSaving}
          onSubmit={handleUpdate}
          onCancel={() => setEditingTerm(null)}
        />
      )}

      {terms.length === 0 ? (
        <div style={{ color: "#6b7280", padding: "16px 0" }}>No terms yet.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
              <th style={{ padding: "10px 12px" }}>Name</th>
              <th style={{ padding: "10px 12px" }}>Starts</th>
              <th style={{ padding: "10px 12px" }}>Ends</th>
              <th style={{ padding: "10px 12px" }}>Status</th>
              <th style={{ padding: "10px 12px" }}></th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <TermRow
                key={term.id}
                term={term}
                onEdit={(t) => {
                  setShowForm(false);
                  setEditingTerm(t);
                }}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CourseTermsPanel;
