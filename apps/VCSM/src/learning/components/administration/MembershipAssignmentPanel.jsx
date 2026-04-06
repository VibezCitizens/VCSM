import React from "react";

export function MembershipAssignmentPanel({
  title,
  actionLabel,
  actorIdLabel,
  onSubmit,
  isSaving = false,
  helperText = "",
  roleOptions = null,
  defaultRole = "",
  roleLabel = "Role",
  statusOptions = null,
  defaultStatus = "",
  statusLabel = "Status",
}) {
  const [value, setValue] = React.useState("");
  const [role, setRole] = React.useState(
    defaultRole || roleOptions?.[0]?.value || "",
  );
  const [status, setStatus] = React.useState(
    defaultStatus || statusOptions?.[0]?.value || "",
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const actorId = value.trim();

    if (!actorId) {
      return;
    }

    const result = await onSubmit?.({
      actorId,
      role,
      status,
    });

    if (result?.ok === false) {
      return;
    }

    setValue("");

    if (roleOptions?.length) {
      setRole(defaultRole || roleOptions[0]?.value || "");
    }

    if (statusOptions?.length) {
      setStatus(defaultStatus || statusOptions[0]?.value || "");
    }
  };

  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
        marginBottom: 16,
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>

      {helperText ? (
        <p style={{ marginTop: 0, marginBottom: 12, color: "#555" }}>{helperText}</p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            {actorIdLabel}
          </label>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            style={{
              width: "100%",
              maxWidth: 360,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d0d7de",
            }}
          />
        </div>

        {roleOptions?.length ? (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              {roleLabel}
            </label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              style={{
                width: "100%",
                maxWidth: 360,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d0d7de",
              }}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {statusOptions?.length ? (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              {statusLabel}
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              style={{
                width: "100%",
                maxWidth: 360,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #d0d7de",
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #222",
            background: "#222",
            color: "#fff",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          {isSaving ? "Saving..." : actionLabel}
        </button>
      </form>
    </div>
  );
}

export default MembershipAssignmentPanel;
