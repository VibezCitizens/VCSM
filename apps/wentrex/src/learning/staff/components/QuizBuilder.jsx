import React from "react";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

const QUESTION_TYPES = [
  { value: "true_false", label: "True / False" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "select_all", label: "Select All That Apply" },
];

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${BORDER}`, fontSize: 14,
  background: "#fff", color: "#0f172a", boxSizing: "border-box",
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function createDefaultOptions(type) {
  if (type === "true_false") {
    return [
      { id: makeId(), text: "True", isCorrect: true, sortOrder: 0 },
      { id: makeId(), text: "False", isCorrect: false, sortOrder: 1 },
    ];
  }
  return [
    { id: makeId(), text: "", isCorrect: false, sortOrder: 0 },
    { id: makeId(), text: "", isCorrect: false, sortOrder: 1 },
  ];
}

export function createEmptyQuestion(sortOrder = 0) {
  return {
    id: makeId(),
    text: "",
    type: "multiple_choice",
    points: 1,
    explanation: "",
    sortOrder,
    options: createDefaultOptions("multiple_choice"),
  };
}

export function calculateTotalPoints(questions) {
  return questions.reduce((sum, q) => sum + (parseFloat(q.points) || 0), 0);
}

export function validateQuiz(questions) {
  const errors = [];
  if (questions.length === 0) errors.push("At least 1 question is required.");
  if (questions.length > 100) errors.push("Maximum 100 questions allowed.");

  questions.forEach((q, i) => {
    const n = i + 1;
    if (!q.text.trim()) errors.push(`Question ${n}: text is required.`);
    if (q.options.length < 2) errors.push(`Question ${n}: at least 2 options required.`);

    const correctCount = q.options.filter(o => o.isCorrect).length;
    if (q.type === "true_false" && correctCount !== 1) errors.push(`Question ${n}: select exactly 1 correct answer.`);
    if (q.type === "multiple_choice" && correctCount !== 1) errors.push(`Question ${n}: select exactly 1 correct answer.`);
    if (q.type === "select_all" && correctCount === 0) errors.push(`Question ${n}: select at least 1 correct answer.`);

    q.options.forEach((o, j) => {
      if (q.type !== "true_false" && !o.text.trim()) errors.push(`Question ${n}, Option ${j + 1}: text is required.`);
    });
  });

  return errors;
}

export default function QuizBuilder({ questions, onChange }) {
  function updateQuestion(idx, patch) {
    const next = [...questions];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function updateOption(qIdx, oIdx, patch) {
    const next = [...questions];
    const opts = [...next[qIdx].options];
    opts[oIdx] = { ...opts[oIdx], ...patch };
    next[qIdx] = { ...next[qIdx], options: opts };
    onChange(next);
  }

  function setCorrect(qIdx, oIdx) {
    const q = questions[qIdx];
    const next = [...questions];
    if (q.type === "select_all") {
      const opts = [...q.options];
      opts[oIdx] = { ...opts[oIdx], isCorrect: !opts[oIdx].isCorrect };
      next[qIdx] = { ...next[qIdx], options: opts };
    } else {
      const opts = q.options.map((o, i) => ({ ...o, isCorrect: i === oIdx }));
      next[qIdx] = { ...next[qIdx], options: opts };
    }
    onChange(next);
  }

  function addOption(qIdx) {
    const next = [...questions];
    const opts = [...next[qIdx].options];
    if (opts.length >= 8) return;
    opts.push({ id: makeId(), text: "", isCorrect: false, sortOrder: opts.length });
    next[qIdx] = { ...next[qIdx], options: opts };
    onChange(next);
  }

  function removeOption(qIdx, oIdx) {
    const next = [...questions];
    const opts = next[qIdx].options.filter((_, i) => i !== oIdx);
    if (opts.length < 2) return;
    next[qIdx] = { ...next[qIdx], options: opts };
    onChange(next);
  }

  function changeQuestionType(qIdx, newType) {
    const next = [...questions];
    next[qIdx] = {
      ...next[qIdx],
      type: newType,
      options: createDefaultOptions(newType),
    };
    onChange(next);
  }

  function addQuestion() {
    if (questions.length >= 100) return;
    onChange([...questions, createEmptyQuestion(questions.length)]);
  }

  function removeQuestion(idx) {
    onChange(questions.filter((_, i) => i !== idx));
  }

  function moveQuestion(idx, dir) {
    const next = [...questions];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  const totalPoints = calculateTotalPoints(questions);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: MUTED }}>
          {questions.length} question{questions.length !== 1 ? "s" : ""} · {totalPoints} total points
        </div>
        <button type="button" onClick={addQuestion} disabled={questions.length >= 100}
          style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: questions.length >= 100 ? MUTED : PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Add Question
        </button>
      </div>

      {questions.map((q, qIdx) => (
        <div key={q.id} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>Question {qIdx + 1}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={() => moveQuestion(qIdx, -1)} disabled={qIdx === 0}
                style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", color: MUTED, cursor: "pointer", fontSize: 12 }}>↑</button>
              <button type="button" onClick={() => moveQuestion(qIdx, 1)} disabled={qIdx === questions.length - 1}
                style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", color: MUTED, cursor: "pointer", fontSize: 12 }}>↓</button>
              <button type="button" onClick={() => removeQuestion(qIdx)}
                style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid #fecaca`, background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer" }}>Remove</button>
            </div>
          </div>

          {/* Question text */}
          <textarea value={q.text} onChange={e => updateQuestion(qIdx, { text: e.target.value })}
            placeholder="Enter your question..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />

          {/* Type + Points */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 4, display: "block" }}>Type</label>
              <select value={q.type} onChange={e => changeQuestionType(qIdx, e.target.value)} style={inputStyle}>
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 4, display: "block" }}>Points</label>
              <input type="number" value={q.points} onChange={e => updateQuestion(qIdx, { points: e.target.value })}
                min="0" step="0.5" style={inputStyle} />
            </div>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
              Answer Options {q.type === "select_all" ? "(select all correct)" : "(select correct)"}
            </label>
            {q.options.map((o, oIdx) => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type={q.type === "select_all" ? "checkbox" : "radio"}
                  name={`q-${q.id}-correct`}
                  checked={o.isCorrect}
                  onChange={() => setCorrect(qIdx, oIdx)}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                {q.type === "true_false" ? (
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a", flex: 1 }}>{o.text}</span>
                ) : (
                  <input type="text" value={o.text} onChange={e => updateOption(qIdx, oIdx, { text: e.target.value })}
                    placeholder={`Option ${oIdx + 1}`}
                    style={{ ...inputStyle, flex: 1 }} />
                )}
                {q.type !== "true_false" && q.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(qIdx, oIdx)}
                    style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", color: MUTED, cursor: "pointer", fontSize: 14 }}>×</button>
                )}
              </div>
            ))}
            {q.type !== "true_false" && q.options.length < 8 && (
              <button type="button" onClick={() => addOption(qIdx)}
                style={{ padding: "6px 12px", borderRadius: 6, border: `1px dashed ${BORDER}`, background: "transparent", color: MUTED, fontSize: 13, cursor: "pointer", alignSelf: "flex-start" }}>
                + Add Option
              </button>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 4, display: "block" }}>Explanation (optional)</label>
            <input type="text" value={q.explanation} onChange={e => updateQuestion(qIdx, { explanation: e.target.value })}
              placeholder="Shown after grading" style={inputStyle} />
          </div>
        </div>
      ))}

      {questions.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: MUTED, background: SURFACE, borderRadius: 12, border: `1px dashed ${BORDER}` }}>
          No questions yet. Click "Add Question" to start building your quiz.
        </div>
      )}
    </div>
  );
}
