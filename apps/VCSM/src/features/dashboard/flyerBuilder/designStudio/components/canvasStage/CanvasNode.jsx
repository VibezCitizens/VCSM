import React from "react";
import DesignStudioNodeBody from "@/features/dashboard/flyerBuilder/designStudio/components/canvasStage/DesignStudioNodeBody";
import { HANDLE_SIZE, RESIZE_CORNERS } from "@/features/dashboard/flyerBuilder/designStudio/components/canvasStage/canvasMath";

export function CanvasNode({
  node,
  selectedNodeId,
  editingTextNodeId,
  activeScale,
  interactionRef,
  onPatchRef,
  onSelectNode,
  setEditingTextNodeId,
}) {
  const selected = node.id === selectedNodeId;
  const locked = Boolean(node.locked);
  const isEditingText = node.type === "text" && node.id === editingTextNodeId;

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelectNode?.(node.id);
        if (isEditingText || locked) return;
        event.preventDefault();

        interactionRef.current = {
          type: "drag",
          nodeId: node.id,
          nodeType: node.type,
          startX: event.clientX,
          startY: event.clientY,
          originX: Number(node.x || 0),
          originY: Number(node.y || 0),
          originW: Number(node.w || 0),
          originH: Number(node.h || 0),
          scale: activeScale,
          moved: false,
          wasSelected: selected,
          pointerType: event.pointerType || "mouse",
        };
      }}
      onDoubleClick={(event) => {
        if (node.type !== "text" || locked) return;
        event.stopPropagation();
        onSelectNode?.(node.id);
        setEditingTextNodeId(node.id);
      }}
      style={{
        position: "absolute",
        left: Number(node.x || 0),
        top: Number(node.y || 0),
        width: Number(node.w || 100),
        height: Number(node.h || 80),
        opacity: Number(node.opacity || 1),
        transform: `rotate(${Number(node.rotation || 0)}deg)`,
        cursor: isEditingText ? "text" : locked ? "default" : "move",
        userSelect: "none",
        touchAction: "none",
        border: selected ? "2px solid rgba(0,255,240,0.9)" : "1px solid transparent",
        boxShadow: selected ? "0 0 0 2px rgba(0,255,240,0.25)" : "none",
        overflow: "hidden",
      }}
    >
      {isEditingText ? (
        <textarea
          autoFocus
          value={node.text || ""}
          onChange={(event) => onPatchRef.current?.(node.id, { text: event.target.value })}
          onBlur={() => setEditingTextNodeId(null)}
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: node.color || "#fff",
            fontSize: Number(node.fontSize || 36),
            fontFamily: node.fontFamily || "Inter, system-ui, sans-serif",
            fontWeight: Number(node.fontWeight || 700),
            lineHeight: 1.15,
            padding: 4,
          }}
        />
      ) : (
        <DesignStudioNodeBody node={node} />
      )}

      {selected && !isEditingText && !locked
        ? RESIZE_CORNERS.map((corner) => (
            <div
              key={corner.key}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.preventDefault();
                interactionRef.current = {
                  type: "resize",
                  corner: corner.key,
                  nodeId: node.id,
                  startX: event.clientX,
                  startY: event.clientY,
                  originX: Number(node.x || 0),
                  originY: Number(node.y || 0),
                  originW: Number(node.w || 0),
                  originH: Number(node.h || 0),
                  scale: activeScale,
                };
              }}
              style={{
                position: "absolute",
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: 999,
                border: "2px solid #fff",
                background: "#22d3ee",
                cursor: corner.cursor,
                ...corner.position,
              }}
            />
          ))
        : null}
    </div>
  );
}
