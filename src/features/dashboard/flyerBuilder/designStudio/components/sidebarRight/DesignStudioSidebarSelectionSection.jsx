import React from "react";

import DesignStudioInlineColorPicker from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioInlineColorPicker";
import {
  dangerBtn,
  fieldLabel,
  fieldWrap,
  input,
  miniBtn,
  sectionTitle,
} from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/designStudioSidebarRight.styles";

export default function DesignStudioSidebarSelectionSection({
  selectedNode,
  selectionLocked,
  onPatchNode,
  onDeleteSelected,
}) {
  return (
    <section style={{ marginTop: 16, display: "grid", gap: 8 }}>
      <div style={sectionTitle}>Selection</div>

      {!selectedNode ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.58)" }}>Select a layer to edit.</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <button
              type="button"
              style={miniBtn}
              onClick={() => onPatchNode(selectedNode.id, { visible: selectedNode.visible === false })}
            >
              {selectedNode.visible === false ? "Show layer" : "Hide layer"}
            </button>
            <button
              type="button"
              style={miniBtn}
              onClick={() => onPatchNode(selectedNode.id, { locked: !selectedNode.locked })}
            >
              {selectionLocked ? "Unlock layer" : "Lock layer"}
            </button>
          </div>

          <SelectionGeometry node={selectedNode} locked={selectionLocked} onPatchNode={onPatchNode} />
          <SelectionTypeFields node={selectedNode} locked={selectionLocked} onPatchNode={onPatchNode} />

          <button type="button" style={dangerBtn} onClick={onDeleteSelected}>
            Delete selected
          </button>
        </>
      )}
    </section>
  );
}

function SelectionGeometry({ node, locked, onPatchNode }) {
  return (
    <>
      <label style={fieldWrap}>
        <span style={fieldLabel}>X</span>
        <input
          type="number"
          value={Math.round(node.x || 0)}
          onChange={(e) => onPatchNode(node.id, { x: Number(e.target.value || 0) })}
          disabled={locked}
          style={input}
        />
      </label>
      <label style={fieldWrap}>
        <span style={fieldLabel}>Y</span>
        <input
          type="number"
          value={Math.round(node.y || 0)}
          onChange={(e) => onPatchNode(node.id, { y: Number(e.target.value || 0) })}
          disabled={locked}
          style={input}
        />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={fieldWrap}>
          <span style={fieldLabel}>W</span>
          <input
            type="number"
            min={24}
            value={Math.round(node.w || 120)}
            onChange={(e) => onPatchNode(node.id, { w: Number(e.target.value || 120) })}
            disabled={locked}
            style={input}
          />
        </label>
        <label style={fieldWrap}>
          <span style={fieldLabel}>H</span>
          <input
            type="number"
            min={24}
            value={Math.round(node.h || 120)}
            onChange={(e) => onPatchNode(node.id, { h: Number(e.target.value || 120) })}
            disabled={locked}
            style={input}
          />
        </label>
      </div>
    </>
  );
}

function SelectionTypeFields({ node, locked, onPatchNode }) {
  if (node.type === "text") {
    return (
      <>
        <label style={fieldWrap}>
          <span style={fieldLabel}>Text</span>
          <textarea
            value={node.text || ""}
            onChange={(e) => onPatchNode(node.id, { text: e.target.value })}
            disabled={locked}
            style={{ ...input, minHeight: 74, resize: "vertical" }}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label style={fieldWrap}>
            <span style={fieldLabel}>Size</span>
            <input
              type="number"
              min={12}
              max={320}
              value={Math.round(node.fontSize || 42)}
              onChange={(e) => onPatchNode(node.id, { fontSize: Number(e.target.value || 42) })}
              disabled={locked}
              style={input}
            />
          </label>
          <label style={fieldWrap}>
            <span style={fieldLabel}>Color</span>
            <DesignStudioInlineColorPicker
              value={node.color || "#ffffff"}
              onChange={(next) => onPatchNode(node.id, { color: next })}
              disabled={locked}
            />
          </label>
        </div>
      </>
    );
  }

  if (node.type === "shape") {
    return (
      <label style={fieldWrap}>
        <span style={fieldLabel}>Fill</span>
        <DesignStudioInlineColorPicker
          value={node.fill || "#7c3aed"}
          onChange={(next) => onPatchNode(node.id, { fill: next })}
          disabled={locked}
        />
      </label>
    );
  }

  if (node.type === "image") {
    return (
      <label style={fieldWrap}>
        <span style={fieldLabel}>Radius</span>
        <input
          type="number"
          min={0}
          max={200}
          value={Math.round(node.radius || 0)}
          onChange={(e) => onPatchNode(node.id, { radius: Number(e.target.value || 0) })}
          disabled={locked}
          style={input}
        />
      </label>
    );
  }

  return null;
}
