import React, { useEffect, useMemo, useRef, useState } from "react";

import DesignStudioNodeBody from "@/features/dashboard/flyerBuilder/designStudio/components/canvasStage/DesignStudioNodeBody";
import {
  getResizedBox,
  HANDLE_SIZE,
  RESIZE_CORNERS,
} from "@/features/dashboard/flyerBuilder/designStudio/components/canvasStage/canvasMath";

const RULER_SIZE = 24;
const GUIDE_COLOR = "#a855f7";

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
  const canvasWidthRef = useRef(1080);

  const [fitScale, setFitScale] = useState(1);
  const [editingTextNodeId, setEditingTextNodeId] = useState(null);
  const [guideX, setGuideX] = useState(540);

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
    canvasWidthRef.current = canvasWidth;
  }, [canvasWidth]);

  useEffect(() => {
    setGuideX((prev) => clamp(prev, 0, canvasWidth));
  }, [canvasWidth]);

  useEffect(() => {
    const host = viewportRef.current;
    if (!host) return undefined;

    const compute = () => {
      const availableWidth = Math.max(260, host.clientWidth - 36 - RULER_SIZE);
      const availableHeight = Math.max(240, host.clientHeight - 36 - RULER_SIZE);
      const widthScale = availableWidth / canvasWidth;
      const heightScale = availableHeight / canvasHeight;
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

      if (drag.type === "guide") {
        const nextX = clamp(Math.round(drag.originGuideX + dx), 0, canvasWidthRef.current);
        setGuideX(nextX);
        return;
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

  const horizontalTicks = useMemo(() => buildRulerTicks(canvasWidth), [canvasWidth]);
  const verticalTicks = useMemo(() => buildRulerTicks(canvasHeight), [canvasHeight]);
  const scaledWidth = Math.round(canvasWidth * activeScale);
  const scaledHeight = Math.round(canvasHeight * activeScale);

  return (
    <div
      ref={viewportRef}
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
        padding: 12,
        minHeight: 0,
        height: "100%",
        overflow: "auto",
      }}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
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
      <style>
        {`
          @media print {
            .no-print-ruler,
            .no-print-guide {
              display: none !important;
            }
          }
        `}
      </style>

      <div
        style={{
          display: "grid",
          justifyContent: "center",
          alignContent: "start",
          minWidth: scaledWidth + RULER_SIZE + 20,
          minHeight: scaledHeight + RULER_SIZE + 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: scaledWidth + RULER_SIZE,
            height: scaledHeight + RULER_SIZE,
          }}
        >
          <div
            className="no-print-ruler"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: RULER_SIZE,
              height: RULER_SIZE,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              background: "linear-gradient(180deg, rgba(17,21,35,0.96), rgba(8,11,21,0.92))",
            }}
          />

          <div
            className="no-print-ruler"
            style={{
              position: "absolute",
              left: RULER_SIZE,
              top: 0,
              width: scaledWidth,
              height: RULER_SIZE,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              background: "linear-gradient(180deg, rgba(17,21,35,0.96), rgba(8,11,21,0.92))",
              overflow: "hidden",
            }}
          >
            {horizontalTicks.map((tick) => (
              <div
                key={`hr-${tick.value}`}
                style={{
                  position: "absolute",
                  left: tick.value * activeScale,
                  top: tick.major ? 0 : 11,
                  width: 1,
                  height: tick.major ? 24 : 10,
                  background: tick.major ? "rgba(255,255,255,0.44)" : "rgba(255,255,255,0.22)",
                }}
              />
            ))}
            {horizontalTicks
              .filter((tick) => tick.major)
              .map((tick) => (
                <div
                  key={`hl-${tick.value}`}
                  style={{
                    position: "absolute",
                    left: tick.value * activeScale + 3,
                    top: 3,
                    fontSize: 10,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.68)",
                    pointerEvents: "none",
                  }}
                >
                  {tick.value}
                </div>
              ))}
          </div>

          <div
            className="no-print-ruler"
            style={{
              position: "absolute",
              left: 0,
              top: RULER_SIZE,
              width: RULER_SIZE,
              height: scaledHeight,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              background: "linear-gradient(180deg, rgba(17,21,35,0.96), rgba(8,11,21,0.92))",
              overflow: "hidden",
            }}
          >
            {verticalTicks.map((tick) => (
              <div
                key={`vr-${tick.value}`}
                style={{
                  position: "absolute",
                  left: tick.major ? 0 : 11,
                  top: tick.value * activeScale,
                  width: tick.major ? 24 : 10,
                  height: 1,
                  background: tick.major ? "rgba(255,255,255,0.44)" : "rgba(255,255,255,0.22)",
                }}
              />
            ))}
            {verticalTicks
              .filter((tick) => tick.major)
              .map((tick) => (
                <div
                  key={`vl-${tick.value}`}
                  style={{
                    position: "absolute",
                    left: 2,
                    top: tick.value * activeScale + 2,
                    transform: "rotate(-90deg)",
                    transformOrigin: "top left",
                    fontSize: 10,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.68)",
                    pointerEvents: "none",
                  }}
                >
                  {tick.value}
                </div>
              ))}
          </div>

          <div
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) {
                onSelectNode?.(null);
                setEditingTextNodeId(null);
              }
            }}
            style={{
              position: "absolute",
              left: RULER_SIZE,
              top: RULER_SIZE,
              width: scaledWidth,
              height: scaledHeight,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 20px 80px rgba(0,0,0,0.55)",
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
                transformOrigin: "top left",
                position: "relative",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.14)",
                background: canvasBackground,
                overflow: "hidden",
              }}
            >
              <div
                className="no-print-guide"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  interactionRef.current = {
                    type: "guide",
                    startX: event.clientX,
                    scale: activeScale,
                    originGuideX: guideX,
                    moved: false,
                  };
                }}
                style={{
                  position: "absolute",
                  left: guideX - 1,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: GUIDE_COLOR,
                  boxShadow: "0 0 10px rgba(168,85,247,0.55)",
                  cursor: "ew-resize",
                  zIndex: 40,
                }}
              />
              <div
                className="no-print-guide"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  interactionRef.current = {
                    type: "guide",
                    startX: event.clientX,
                    scale: activeScale,
                    originGuideX: guideX,
                    moved: false,
                  };
                }}
                style={{
                  position: "absolute",
                  left: guideX - 32,
                  top: 10,
                  width: 64,
                  height: 22,
                  borderRadius: 999,
                  border: "1px solid rgba(196,181,253,0.75)",
                  background: "rgba(109,40,217,0.35)",
                  color: "#f5f3ff",
                  fontSize: 10,
                  fontWeight: 900,
                  display: "grid",
                  placeItems: "center",
                  cursor: "ew-resize",
                  zIndex: 41,
                  userSelect: "none",
                }}
              >
                {guideX}px
              </div>

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
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildRulerTicks(size) {
  const ticks = [];
  const max = Math.max(0, Number(size) || 0);

  for (let value = 0; value <= max; value += 20) {
    ticks.push({
      value,
      major: value % 100 === 0,
    });
  }

  return ticks;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
