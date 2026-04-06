import React from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Lock,
  LockOpen,
  Square,
  Type,
} from "lucide-react";

import {
  layerListWrap,
  layerMeta,
  layerName,
  layerOpBtn,
  layerOps,
  layerRow,
  layersCountBadge,
  layerSelectBtn,
  layerTypeBadge,
  miniBtn,
  sectionTitle,
  sectionTitleRow,
} from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/designStudioSidebarRight.styles";

export default function DesignStudioSidebarLayersSection({
  nodes,
  selectedNodeId,
  selectedNode,
  selectionLocked,
  onSelectNode,
  onPatchNode,
  onBringFront,
  onSendBack,
  onBringForward,
  onSendBackward,
}) {
  const orderedLayers = [...(nodes || [])].sort((a, b) => (b.z || 0) - (a.z || 0));

  return (
    <section style={{ marginTop: 16, display: "grid", gap: 8 }}>
      <div style={sectionTitleRow}>
        <span style={sectionTitle}>Layers</span>
        <span style={layersCountBadge}>{orderedLayers.length}</span>
      </div>

      {selectedNode ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button type="button" style={miniBtn} onClick={() => onBringForward?.(selectedNode.id)} disabled={selectionLocked}>
            Forward
          </button>
          <button type="button" style={miniBtn} onClick={() => onSendBackward?.(selectedNode.id)} disabled={selectionLocked}>
            Backward
          </button>
          <button type="button" style={miniBtn} onClick={() => onBringFront?.(selectedNode.id)} disabled={selectionLocked}>
            To front
          </button>
          <button type="button" style={miniBtn} onClick={() => onSendBack?.(selectedNode.id)} disabled={selectionLocked}>
            To back
          </button>
        </div>
      ) : null}

      <div style={layerListWrap}>
        {orderedLayers.map((node, idx) => {
          const active = node.id === selectedNodeId;
          const visible = node.visible !== false;
          const locked = !!node.locked;
          const atTop = idx === 0;
          const atBottom = idx === orderedLayers.length - 1;

          return (
            <div
              key={node.id}
              style={{
                ...layerRow,
                border: active
                  ? "1px solid rgba(0,255,240,0.52)"
                  : "1px solid rgba(255,255,255,0.14)",
                background: active
                  ? "linear-gradient(135deg, rgba(0,255,240,0.14), rgba(124,58,237,0.14))"
                  : "rgba(255,255,255,0.05)",
              }}
            >
              <button type="button" onClick={() => onSelectNode?.(node.id)} style={layerSelectBtn}>
                <span style={{ color: "rgba(255,255,255,0.55)" }}>
                  <GripVertical size={14} />
                </span>
                <span style={layerTypeBadge}>{layerTypeIcon(node.type)}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={layerName}>{labelForLayer(node)}</span>
                  <span style={layerMeta}>
                    z{node.z} {locked ? "• locked" : ""} {!visible ? "• hidden" : ""}
                  </span>
                </span>
              </button>

              <div style={layerOps}>
                <button
                  type="button"
                  style={layerOpBtn}
                  onClick={() => {
                    const nextVisible = !visible;
                    onPatchNode?.(node.id, { visible: nextVisible });
                    if (!nextVisible && active) onSelectNode?.(null);
                  }}
                  title={visible ? "Hide layer" : "Show layer"}
                >
                  {visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  type="button"
                  style={layerOpBtn}
                  onClick={() => onPatchNode?.(node.id, { locked: !locked })}
                  title={locked ? "Unlock layer" : "Lock layer"}
                >
                  {locked ? <Lock size={14} /> : <LockOpen size={14} />}
                </button>
                <button
                  type="button"
                  style={layerOpBtn}
                  onClick={() => onBringForward?.(node.id)}
                  disabled={locked || atTop}
                  title="Move layer up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  style={layerOpBtn}
                  onClick={() => onSendBackward?.(node.id)}
                  disabled={locked || atBottom}
                  title="Move layer down"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {!orderedLayers.length ? (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.58)" }}>No layers yet.</div>
        ) : null}
      </div>
    </section>
  );
}

function labelForLayer(node) {
  if (!node) return "Layer";
  if (node.type === "text") {
    const text = String(node.text || "Text").trim();
    return text ? `Text: ${text.slice(0, 18)}` : "Text";
  }
  if (node.type === "image") return "Photo";
  return "Shape";
}

function layerTypeIcon(type) {
  if (type === "text") return <Type size={13} />;
  if (type === "image") return <ImageIcon size={13} />;
  return <Square size={12} />;
}
