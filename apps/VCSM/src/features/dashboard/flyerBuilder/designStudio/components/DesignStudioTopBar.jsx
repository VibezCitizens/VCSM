import React from "react";
import { Download, Expand, PanelRightClose, PanelRightOpen, RotateCw, Save } from "lucide-react";

import DesignStudioTextColorPicker from "@/features/dashboard/flyerBuilder/designStudio/components/topBar/DesignStudioTextColorPicker";

export default function DesignStudioTopBar({
  title,
  dirty,
  saving,
  exporting,
  inspectorOpen,
  onToggleInspector,
  onOpenResize,
  showTextTools,
  onTextSizeDown,
  onTextSizeUp,
  textColor,
  onTextColorChange,
  zoomLabel,
  onZoomOut,
  onZoomIn,
  onZoomFit,
  orientationLabel,
  onToggleOrientation,
  onSave,
  onExportPng,
  onExportPdf,
  onOpenPreview,
}) {
  return (
    <div style={root}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 900, letterSpacing: 0.7 }}>{title || "Design Studio"}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.62)" }}>
          {dirty ? "Unsaved changes" : "All changes saved"}
        </div>
      </div>

      <div style={rightWrap}>
        <div style={toolStrip}>
          <button type="button" onClick={onToggleInspector} style={stripBtn}>
            {inspectorOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            Edit page
          </button>
          <button type="button" onClick={onOpenResize} style={stripBtn}>
            <Expand size={15} />
            Resize
          </button>
          <button type="button" onClick={onToggleOrientation} style={stripBtn}>
            <RotateCw size={15} />
            {orientationLabel || "Rotate"}
          </button>

          {showTextTools ? (
            <>
              <button type="button" onClick={onTextSizeDown} style={compactBtn}>
                A-
              </button>
              <button type="button" onClick={onTextSizeUp} style={compactBtn}>
                A+
              </button>
              <DesignStudioTextColorPicker
                value={textColor || "#ffffff"}
                onChange={onTextColorChange}
                buttonStyle={{ ...compactBtn, width: 42, padding: 0, justifyContent: "center" }}
              />
            </>
          ) : null}

          <button type="button" onClick={onZoomOut} style={compactBtn}>
            -
          </button>
          <button type="button" onClick={onZoomFit} style={zoomValueBtn}>
            {zoomLabel || "Fit"}
          </button>
          <button type="button" onClick={onZoomIn} style={compactBtn}>
            +
          </button>
        </div>

        <button type="button" onClick={onSave} disabled={saving} style={actionBtn("accent")}>
          <Save size={14} />
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onExportPng} disabled={exporting} style={actionBtn("soft")}>
          <Download size={14} />
          PNG
        </button>
        <button type="button" onClick={onExportPdf} disabled={exporting} style={actionBtn("soft")}>
          <Download size={14} />
          PDF
        </button>
        <button type="button" onClick={onOpenPreview} style={actionBtn("soft")}>
          Preview
        </button>
      </div>
    </div>
  );
}

function actionBtn(kind) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    border: kind === "accent" ? "1px solid rgba(0,255,240,0.3)" : "1px solid rgba(255,255,255,0.2)",
    background:
      kind === "accent"
        ? "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.16), rgba(0,153,255,0.12))"
        : "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    padding: "8px 10px",
    cursor: "pointer",
  };
}

const root = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  background: "linear-gradient(180deg, rgba(18,22,36,0.86), rgba(9,12,24,0.78))",
  padding: 12,
};

const rightWrap = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const toolStrip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: 4,
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.06)",
};

const stripBtn = {
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 800,
  padding: "0 12px",
  cursor: "pointer",
};

const compactBtn = {
  ...stripBtn,
  minWidth: 42,
  justifyContent: "center",
  padding: "0 10px",
};

const zoomValueBtn = {
  ...stripBtn,
  minWidth: 64,
  justifyContent: "center",
};
