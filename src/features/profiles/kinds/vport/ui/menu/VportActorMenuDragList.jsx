// src/features/profiles/kinds/vport/ui/menu/VportActorMenuDragList.jsx

import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";

/**
 * UI: Minimal drag-to-reorder list (no external deps)
 *
 * Contract:
 * - Pure UI (no DAL / no Supabase)
 * - Controlled-ish: takes `items` and emits `onReorder(nextItems)`
 *
 * Notes:
 * - Uses HTML5 drag/drop (works well enough for desktop; mobile support varies).
 * - If you want proper mobile drag, swap to @dnd-kit later without changing call sites.
 *
 * Props:
 * - items: Array<{ id: string, name?: string }>
 * - renderItem: (item) => ReactNode
 * - getId: (item) => string (optional)
 * - onReorder: (nextItems) => void (optional)
 * - disabled: boolean
 * - className: string
 */
export function VportActorMenuDragList({
  items = [],
  renderItem,
  getId,
  onReorder,
  disabled = false,
  className = "",
} = {}) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const idOf = useCallback(
    (it) => {
      if (!it) return "";
      if (getId) return (getId(it) ?? "").toString();
      return (it.id ?? "").toString();
    },
    [getId]
  );

  const [draggingId, setDraggingId] = useState(null);
  const overIdRef = useRef(null);

  useEffect(() => {
    if (disabled) {
      setDraggingId(null);
      overIdRef.current = null;
    }
  }, [disabled]);

  const move = useCallback((arr, fromIdx, toIdx) => {
    const next = arr.slice();
    const [picked] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, picked);
    return next;
  }, []);

  const handleDragStart = useCallback(
    (e, item) => {
      if (disabled) return;

      const id = idOf(item);
      if (!id) return;

      setDraggingId(id);
      overIdRef.current = id;

      // required for Firefox
      try {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
      } catch {
        // ignore
      }
    },
    [disabled, idOf]
  );

  const handleDragOver = useCallback(
    (e, item) => {
      if (disabled) return;
      e.preventDefault(); // allow drop

      const id = idOf(item);
      if (!id) return;

      overIdRef.current = id;
    },
    [disabled, idOf]
  );

  const handleDrop = useCallback(
    (e, item) => {
      if (disabled) return;
      e.preventDefault();

      const fromId = draggingId;
      const toId = idOf(item);

      setDraggingId(null);

      if (!fromId || !toId || fromId === toId) return;
      if (!onReorder) return;

      const fromIdx = safeItems.findIndex((it) => idOf(it) === fromId);
      const toIdx = safeItems.findIndex((it) => idOf(it) === toId);

      if (fromIdx < 0 || toIdx < 0) return;

      const next = move(safeItems, fromIdx, toIdx);
      onReorder(next);
    },
    [disabled, draggingId, idOf, onReorder, safeItems, move]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    overIdRef.current = null;
  }, []);

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {safeItems.map((item) => {
        const id = idOf(item);
        const isDragging = draggingId && id === draggingId;

        return (
          <div
            key={id || Math.random()}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDrop={(e) => handleDrop(e, item)}
            onDragEnd={handleDragEnd}
            style={{
              opacity: isDragging ? 0.6 : 1,
              cursor: disabled ? "default" : "grab",
              userSelect: "none",
            }}
          >
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* Drag handle */}
              <div
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 18,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 8,
                  background: "#f3f4f6",
                  flexShrink: 0,
                  fontSize: 12,
                }}
                title={disabled ? "" : "Drag to reorder"}
              >
                ⠿
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                {typeof renderItem === "function" ? renderItem(item) : item?.name ?? id}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VportActorMenuDragList;
