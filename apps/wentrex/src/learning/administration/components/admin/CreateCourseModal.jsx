import { useState } from "react";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--learning-border, #d0d7de)",
  fontSize: 14,
  background: "var(--learning-surface, #fff)",
  color: "var(--learning-text, #08111b)",
  boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--learning-text)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function CreateCourseModal({
  terms = [],
  isSaving = false,
  onCreateCourse,
  onClose,
}) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("organization");
  const [termId, setTermId] = useState("");
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setFeedback(null);

    const result = await onCreateCourse({
      title: title.trim(),
      code: code.trim() || null,
      description: description.trim() || null,
      visibility,
      termId: termId || null,
    });

    if (result?.ok) {
      setFeedback({ ok: true, message: `"${title.trim()}" created as draft.` });
      setTimeout(onClose, 1500);
    } else {
      setFeedback({
        ok: false,
        message: result?.error?.message ?? result?.error?.code ?? "Failed to create course.",
      });
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--learning-surface, #fff)",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Create Course"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create Course</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--learning-muted-text)",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Title *">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Biology"
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Course Code">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. BIO-101"
              style={inputStyle}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief course description..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <Field label="Visibility">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              style={inputStyle}
            >
              <option value="private">Private</option>
              <option value="organization">Organization</option>
              <option value="public">Public</option>
            </select>
          </Field>

          {terms.length > 0 && (
            <Field label="Term">
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                style={inputStyle}
              >
                <option value="">No term</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>
          )}

          {feedback && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: feedback.ok ? "#dcfce7" : "#fef2f2",
                color: feedback.ok ? "#166534" : "#7f1d1d",
                fontSize: 14,
              }}
            >
              {feedback.message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="learning-button learning-button-secondary">
              {feedback?.ok ? "Done" : "Cancel"}
            </button>
            {!feedback?.ok && (
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="learning-button learning-button-primary"
              >
                {isSaving ? "Creating..." : "Create Course"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourseModal;
