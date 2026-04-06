import React, { useState } from "react";

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--learning-border, #d0d7de)",
  fontSize: 14,
  background: "var(--learning-surface, #fff)",
  color: "var(--learning-text, #08111b)",
  boxSizing: "border-box",
  width: "100%",
};

export function CreateParentPanel({
  students = [],
  onCreateParent,
  isSaving = false,
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [studentActorId, setStudentActorId] = useState("");
  const [sendInvite, setSendInvite] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const canSubmit =
    displayName.trim() && email.trim() && studentActorId && !isSaving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!canSubmit) return;

    const response = await onCreateParent({
      displayName: displayName.trim(),
      email: email.trim(),
      studentActorId,
      sendInvite,
    });

    if (response?.ok === false) {
      setError(
        response.error?.message ??
          response.error?.code ??
          "Failed to create parent.",
      );
      return;
    }

    setResult(response?.data ?? response);
    setDisplayName("");
    setEmail("");
    setStudentActorId("");
    setSendInvite(false);
  };

  const activeStudents = students.filter(
    (s) => s.role === "student" && s.status !== "removed",
  );

  return (
    <div
      className="learning-card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>
          Create Parent Account
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--learning-muted-text, #64748b)",
          }}
        >
          Creates a new user account (or reuses an existing one), enrolls them as
          a parent in this course, and links them to the selected student.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--learning-text, #08111b)",
            }}
          >
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Mary Smith"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--learning-text, #08111b)",
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@example.com"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--learning-text, #08111b)",
            }}
          >
            Student
          </label>
          {activeStudents.length > 0 ? (
            <select
              value={studentActorId}
              onChange={(e) => setStudentActorId(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">Select a student...</option>
              {activeStudents.map((s) => (
                <option key={s.actorId} value={s.actorId}>
                  {s.displayName ?? s.actorId}
                </option>
              ))}
            </select>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--learning-muted-text, #64748b)",
              }}
            >
              No students enrolled in this course yet.
            </p>
          )}
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--learning-text, #08111b)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={sendInvite}
            onChange={(e) => setSendInvite(e.target.checked)}
          />
          Send invite email
        </label>

        {error && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: "#fef3f2",
              color: "#b42318",
              border: "1px solid #fecdca",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
              fontSize: 13,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <strong>Parent created successfully</strong>
            {result.createdNewUser && result.generatedPassword && (
              <span>
                Generated password:{" "}
                <code
                  style={{
                    background: "#e2e8f0",
                    padding: "2px 6px",
                    borderRadius: 4,
                    userSelect: "all",
                  }}
                >
                  {result.generatedPassword}
                </code>
              </span>
            )}
            {result.createdNewUser === false && (
              <span>Existing account reused — no new password generated.</span>
            )}
            {result.inviteSent && <span>Invite email sent.</span>}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="learning-button learning-button-primary"
          style={{ alignSelf: "flex-start" }}
        >
          {isSaving ? "Creating..." : "Create Parent"}
        </button>
      </form>
    </div>
  );
}

export default CreateParentPanel;
