import React, { useState } from "react";

export function ParentStudentLinkPanel({
  onLink,
  isSaving = false,
}) {
  const [parentActorId, setParentActorId] = useState("");
  const [studentActorId, setStudentActorId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!parentActorId || !studentActorId) return;

    const result = await onLink({
      parentActorId,
      studentActorId,
    });

    if (result?.ok === false) {
      return;
    }

    setParentActorId("");
    setStudentActorId("");
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <h3>Link Parent to Student</h3>
      <p style={{ marginTop: 0, color: "#555" }}>
        This will create an active parent membership first if the observer is
        not enrolled yet.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Parent Actor ID</label>
          <br />
          <input
            value={parentActorId}
            onChange={(e) => setParentActorId(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Student Actor ID</label>
          <br />
          <input
            value={studentActorId}
            onChange={(e) => setStudentActorId(e.target.value)}
          />
        </div>

        <button type="submit" disabled={isSaving}>
          {isSaving ? "Linking..." : "Link Parent"}
        </button>
      </form>
    </div>
  );
}

export default ParentStudentLinkPanel;
