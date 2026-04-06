import React from "react";

const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#f8fafc";

function Badge({ published }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: published ? "#dcfce7" : "#fef9c3",
      color: published ? "#166534" : "#854d0e",
    }}>
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default function LessonsTab({ modules, lessons }) {
  const lessonsByModule = new Map();
  for (const l of lessons) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push(l);
    lessonsByModule.set(l.module_id, arr);
  }

  const unassigned = lessons.filter(l => !l.module_id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 14, color: MUTED }}>
        {modules.length} module{modules.length !== 1 ? "s" : ""}, {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
      </div>

      {modules.length === 0 && lessons.length === 0 && (
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, textAlign: "center", color: MUTED }}>
          No modules or lessons yet.
        </div>
      )}

      {modules.map(m => {
        const modLessons = lessonsByModule.get(m.id) ?? [];
        return (
          <div key={m.id} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: SURFACE, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{m.title}</span>
                {m.description && <span style={{ fontSize: 13, color: MUTED, marginLeft: 12 }}>{m.description}</span>}
              </div>
              <Badge published={m.is_published} />
            </div>
            {modLessons.length === 0 ? (
              <div style={{ padding: 16, color: MUTED, fontSize: 13 }}>No lessons in this module.</div>
            ) : (
              modLessons.sort((a, b) => a.sort_order - b.sort_order).map(l => (
                <div key={l.id} style={{ padding: "10px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: MUTED, fontSize: 12, fontFamily: "monospace", width: 24 }}>{l.sort_order}</span>
                    <span style={{ color: "#0f172a", fontWeight: 500 }}>{l.title}</span>
                    <span style={{ color: MUTED, fontSize: 12 }}>{l.lesson_type}</span>
                  </div>
                  <Badge published={l.is_published} />
                </div>
              ))
            )}
          </div>
        );
      })}

      {unassigned.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: MUTED }}>Unassigned Lessons</span>
          </div>
          {unassigned.map(l => (
            <div key={l.id} style={{ padding: "10px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
              <span style={{ color: "#0f172a", fontWeight: 500 }}>{l.title}</span>
              <Badge published={l.is_published} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
