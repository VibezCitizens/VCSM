import React, { useEffect, useMemo, useRef, useState } from "react";
import DesignStudioNodeBody from "@/features/dashboard/flyerBuilder/designStudio/components/canvasStage/DesignStudioNodeBody";
import {
  getResizedBox,
  HANDLE_SIZE,
  RESIZE_CORNERS,
} from "@/features/dashboard/flyerBuilder/designStudio/components/canvasStage/canvasMath";

export default function DesignStudioCanvasStage({
  scene,
  selectedNodeId,
  onSelectNode,
  onPatchNode,
  zoomMode = "fit",
  manualZoom = 1,
  onFitScaleChange,
  onZoomBy,
}) {
  const viewportRef = useRef(null);
  const interactionRef = useRef(null);
  const onPatchRef = useRef(onPatchNode);

  const [fitScale, setFitScale] = useState(1);
  const [editingTextNodeId, setEditingTextNodeId] = useState(null);

  useEffect(() => {
    onPatchRef.current = onPatchNode;
  }, [onPatchNode]);

  useEffect(() => {
    if (!editingTextNodeId) return;
    if (selectedNodeId !== editingTextNodeId) setEditingTextNodeId(null);
  }, [editingTextNodeId, selectedNodeId]);

  const canvasWidth = scene?.meta?.width || 1080;
  const canvasHeight = scene?.meta?.height || 1350;
  const canvasBackground = scene?.meta?.background || "#0b1020";

  useEffect(() => {
    const host = viewportRef.current;
    if (!host) return undefined;

    const compute = () => {
      const availableWidth = Math.max(320, host.clientWidth - 36);
      const availableHeight = Math.max(260, host.clientHeight - 36);
      const widthScale = availableWidth / canvasWidth;
      const hasHeightConstraint = host.clientHeight > 220;
      const heightScale = hasHeightConstraint ? availableHeight / canvasHeight : 1;
      const nextScale = Math.min(1, widthScale, heightScale);
      const safeScale = Number.isFinite(nextScale) ? nextScale : 1;
      setFitScale(safeScale);
      onFitScaleChange?.(safeScale);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(host);

    return () => ro.disconnect();
  }, [canvasHeight, canvasWidth, onFitScaleChange]);

  const activeScale = useMemo(() => {
    if (zoomMode === "fit") return fitScale;
    const z = Number(manualZoom);
    if (!Number.isFinite(z)) return fitScale;
    return Math.min(2.5, Math.max(0.2, z));
  }, [fitScale, manualZoom, zoomMode]);

  useEffect(() => {
    const onMove = (event) => {
      const drag = interactionRef.current;
      if (!drag) return;

      const dx = (event.clientX - drag.startX) / drag.scale;
      const dy = (event.clientY - drag.startY) / drag.scale;
      if (Math.abs(dx) > 0.8 || Math.abs(dy) > 0.8) {
        drag.moved = true;
      }

      if (drag.type === "drag") {
        onPatchRef.current?.(drag.nodeId, {
          x: Math.round(drag.originX + dx),
          y: Math.round(drag.originY + dy),
        });
      }

      if (drag.type === "resize") {
        const next = getResizedBox({
          corner: drag.corner || "se",
          originX: drag.originX,
          originY: drag.originY,
          originW: drag.originW,
          originH: drag.originH,
          dx,
          dy,
          minSize: 24,
        });
        onPatchRef.current?.(drag.nodeId, next);
      }
    };

    const onUp = () => {
      const drag = interactionRef.current;
      if (
        drag?.type === "drag" &&
        !drag.moved &&
        drag.nodeType === "text" &&
        (drag.wasSelected || drag.pointerType !== "mouse")
      ) {
        setEditingTextNodeId(drag.nodeId);
      }
      interactionRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const sortedNodes = useMemo(
    () => [...(scene?.nodes || [])].sort((a, b) => (a.z || 0) - (b.z || 0)),
    [scene?.nodes]
  );
  const visibleNodes = useMemo(
    () => sortedNodes.filter((node) => node?.visible !== false),
    [sortedNodes]
  );

  return (
    <div
      ref={viewportRef}
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
        padding: 16,
        minHeight: 0,
        height: "100%",
        overflow: "auto",
      }}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          onSelectNode?.(null);
          setEditingTextNodeId(null);
        }
      }}
      onWheel={(event) => {
        if (!event.ctrlKey) return;
        event.preventDefault();
        onZoomBy?.(event.deltaY > 0 ? -0.08 : 0.08);
      }}
    >
      <div
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onSelectNode?.(null);
            setEditingTextNodeId(null);
          }
        }}
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `scale(${activeScale})`,
          transformOrigin: "top center",
          margin: "0 auto",
          position: "relative",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.14)",
          background: canvasBackground,
          boxShadow: "0 20px 80px rgba(0,0,0,0.55)",
          overflow: "hidden",
        }}
      >
        {visibleNodes.map((node) => {
          const selected = node.id === selectedNodeId;
          const locked = Boolean(node.locked);
          const isEditingText = node.type === "text" && node.id === editingTextNodeId;

          return (
            <div
              key={node.id}
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

              {selected && !isEditingText && !locked ? (
                RESIZE_CORNERS.map((corner) => (
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
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
