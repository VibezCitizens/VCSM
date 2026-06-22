import React, { useEffect, useMemo, useRef, useState } from "react";

import DesignStudioNodeBody from "@/features/flyerBuilder/designStudio/components/canvasStage/DesignStudioNodeBody";
import { CanvasRulers } from "@/features/flyerBuilder/designStudio/components/canvasStage/CanvasRulers";
import { CanvasNode } from "@/features/flyerBuilder/designStudio/components/canvasStage/CanvasNode";
import { useCanvasInteraction } from "@/features/flyerBuilder/designStudio/components/canvasStage/useCanvasInteraction";
import {
  buildRulerTicks,
  clamp,
} from "@/features/flyerBuilder/designStudio/components/canvasStage/canvasMath";

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

  useEffect(() => { onPatchRef.current = onPatchNode; }, [onPatchNode]);

  useEffect(() => {
    if (!editingTextNodeId) return;
    if (selectedNodeId !== editingTextNodeId) setEditingTextNodeId(null);
  }, [editingTextNodeId, selectedNodeId]);

  const canvasWidth = scene?.meta?.width || 1080;
  const canvasHeight = scene?.meta?.height || 1350;
  const canvasBackground = scene?.meta?.background || "#0b1020";

  useEffect(() => { canvasWidthRef.current = canvasWidth; }, [canvasWidth]);
  useEffect(() => { setGuideX((prev) => clamp(prev, 0, canvasWidth)); }, [canvasWidth]);

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

  // Store setGuideX on the interaction ref shape so the hook can call it
  useEffect(() => { if (interactionRef.current) interactionRef.current.setGuideX = setGuideX; }, []);
  const interactionRefWithSetter = useMemo(() => ({
    get current() { return interactionRef.current; },
    set current(v) {
      if (v && v.type === "guide") v.setGuideX = setGuideX;
      interactionRef.current = v;
    },
  }), []);

  useCanvasInteraction({
    interactionRef: interactionRefWithSetter,
    onPatchRef,
    canvasWidthRef,
    setEditingTextNodeId,
  });

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
      <style>{`@media print { .no-print-ruler, .no-print-guide { display: none !important; } }`}</style>

      <div
        style={{
          display: "grid",
          justifyContent: "center",
          alignContent: "start",
          minWidth: scaledWidth + RULER_SIZE + 20,
          minHeight: scaledHeight + RULER_SIZE + 20,
        }}
      >
        <div style={{ position: "relative", width: scaledWidth + RULER_SIZE, height: scaledHeight + RULER_SIZE }}>
          <CanvasRulers
            horizontalTicks={horizontalTicks}
            verticalTicks={verticalTicks}
            scaledWidth={scaledWidth}
            scaledHeight={scaledHeight}
            activeScale={activeScale}
            RULER_SIZE={RULER_SIZE}
          />

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
              {/* Guide line */}
              <div
                className="no-print-guide"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  interactionRefWithSetter.current = {
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
                  interactionRefWithSetter.current = {
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

              {visibleNodes.map((node) => (
                <CanvasNode
                  key={node.id}
                  node={node}
                  selectedNodeId={selectedNodeId}
                  editingTextNodeId={editingTextNodeId}
                  activeScale={activeScale}
                  interactionRef={interactionRefWithSetter}
                  onPatchRef={onPatchRef}
                  onSelectNode={onSelectNode}
                  setEditingTextNodeId={setEditingTextNodeId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
