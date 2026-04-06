import React from "react";
import { Trash2 } from "lucide-react";

export default function DesignStudioPagesRail({
  pages,
  activePageId,
  versionsByPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  allowAddPage = false,
  canDeletePages = false,
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        padding: 10,
        display: "flex",
        alignItems: "stretch",
        gap: 8,
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 auto", overflowX: "auto" }}>
        {(pages || []).map((page, idx) => {
          const isActive = page.id === activePageId;
          const version = versionsByPageId?.[page.id];
          const canDelete = Boolean(canDeletePages);

          return (
            <div key={page.id} style={{ position: "relative", minWidth: 146 }}>
              <button
                type="button"
                onClick={() => onSelectPage(page.id)}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: isActive
                    ? "1px solid rgba(0,255,240,0.5)"
                    : "1px solid rgba(255,255,255,0.16)",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(0,255,240,0.16), rgba(124,58,237,0.16))"
                    : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  textAlign: "left",
                  padding: 10,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800 }}>Page {idx + 1}</div>
                <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                  {page.width}x{page.height}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                  Version {version?.version || 1}
                </div>
              </button>

              {canDelete ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeletePage?.(page.id);
                  }}
                  style={deleteBtn}
                  title="Delete page"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {allowAddPage ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 }}>
          <button type="button" onClick={onAddPage} style={pillBtn}>
            Add page
          </button>
        </div>
      ) : null}
    </div>
  );
}

const pillBtn = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 18px",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer",
};

const deleteBtn = {
  position: "absolute",
  top: 6,
  right: 6,
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid rgba(255,95,145,0.55)",
  background: "rgba(255,95,145,0.16)",
  color: "#ffd5e2",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
