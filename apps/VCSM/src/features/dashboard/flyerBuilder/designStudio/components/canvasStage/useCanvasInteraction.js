import { useEffect } from "react";
import { getResizedBox } from "@/features/dashboard/flyerBuilder/designStudio/components/canvasStage/canvasMath";

// Wires global pointermove/pointerup to the shared interactionRef so drag,
// resize, and guide interactions work across the full canvas surface.
export function useCanvasInteraction({ interactionRef, onPatchRef, canvasWidthRef, setEditingTextNodeId }) {
  useEffect(() => {
    const onMove = (event) => {
      const drag = interactionRef.current;
      if (!drag) return;

      const dx = (event.clientX - drag.startX) / drag.scale;
      const dy = (event.clientY - drag.startY) / drag.scale;
      if (Math.abs(dx) > 0.8 || Math.abs(dy) > 0.8) drag.moved = true;

      if (drag.type === "guide") {
        const nextX = Math.max(0, Math.min(Math.round(drag.originGuideX + dx), canvasWidthRef.current));
        drag.setGuideX(nextX);
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
  }, [interactionRef, onPatchRef, canvasWidthRef, setEditingTextNodeId]);
}
