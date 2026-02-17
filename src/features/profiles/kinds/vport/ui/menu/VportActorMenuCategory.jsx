// src/features/profiles/kinds/vport/ui/menu/VportActorMenuCategory.jsx

import React, { useMemo, useState, useCallback } from "react";

/**
 * UI: Render a single Vport Actor Menu Category + its items.
 *
 * Expected domain shapes (from your models):
 * category: {
 *   id, actorId, key, name, description, sortOrder, isActive, createdAt, updatedAt,
 *   items: [{ id, actorId, categoryId, key, name, description, sortOrder, isActive, createdAt, updatedAt }]
 * }
 *
 * This component is intentionally "dumb UI":
 * - No Supabase
 * - No DAL
 * - No controller calls directly
 * - Delegates actions via callbacks
 */
export function VportActorMenuCategory({
  category,
  items, // optional override; defaults to category.items
  includeInactive = false,

  // Category actions
  onEditCategory,
  onDeleteCategory,

  // Item actions
  onCreateItem,
  onEditItem,
  onDeleteItem,

  // UI flags (optional)
  disabled = false,
  deletingCategory = false,
  savingCategory = false,
  deletingItemIds = null, // Set<string> | string[] | null
  savingItemIds = null, // Set<string> | string[] | null

  className = "",
} = {}) {
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");

  const safeCategory = category ?? null;

  const effectiveItems = useMemo(() => {
    const list = Array.isArray(items) ? items : safeCategory?.items ?? [];
    if (includeInactive) return list;

    return list.filter((it) => it?.isActive !== false);
  }, [items, safeCategory, includeInactive]);

  const deletingItemSet = useMemo(() => {
    if (!deletingItemIds) return new Set();
    if (deletingItemIds instanceof Set) return deletingItemIds;
    if (Array.isArray(deletingItemIds)) return new Set(deletingItemIds);
    return new Set();
  }, [deletingItemIds]);

  const savingItemSet = useMemo(() => {
    if (!savingItemIds) return new Set();
    if (savingItemIds instanceof Set) return savingItemIds;
    if (Array.isArray(savingItemIds)) return new Set(savingItemIds);
    return new Set();
  }, [savingItemIds]);

  const canInteract = !disabled;

  const handleDeleteCategory = useCallback(async () => {
    if (!safeCategory?.id) return;
    if (!onDeleteCategory) return;

    await onDeleteCategory({ categoryId: safeCategory.id });
  }, [safeCategory, onDeleteCategory]);

  const handleEditCategory = useCallback(() => {
    if (!safeCategory?.id) return;
    if (!onEditCategory) return;

    onEditCategory(safeCategory);
  }, [safeCategory, onEditCategory]);

  const openCreateItem = useCallback(() => {
    if (!canInteract) return;
    setIsCreatingItem(true);
    setNewItemName("");
    setNewItemDescription("");
  }, [canInteract]);

  const cancelCreateItem = useCallback(() => {
    setIsCreatingItem(false);
    setNewItemName("");
    setNewItemDescription("");
  }, []);

  const submitCreateItem = useCallback(async () => {
    if (!safeCategory?.id) return;
    if (!onCreateItem) return;

    const name = (newItemName ?? "").trim();
    if (!name) return;

    await onCreateItem({
      categoryId: safeCategory.id,
      name,
      description: (newItemDescription ?? "").trim() || null,
    });

    cancelCreateItem();
  }, [
    safeCategory,
    onCreateItem,
    newItemName,
    newItemDescription,
    cancelCreateItem,
  ]);

  const handleEditItem = useCallback(
    (item) => {
      if (!item?.id) return;
      if (!onEditItem) return;
      onEditItem(item);
    },
    [onEditItem]
  );

  const handleDeleteItem = useCallback(
    async (item) => {
      if (!item?.id) return;
      if (!onDeleteItem) return;
      await onDeleteItem({ itemId: item.id });
    },
    [onDeleteItem]
  );

  if (!safeCategory) return null;

  return (
    <section className={className} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 16, lineHeight: "20px" }}>
              {safeCategory.name || "Untitled Category"}
            </h3>

            {safeCategory.isActive === false ? (
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#f3f4f6",
                }}
              >
                Inactive
              </span>
            ) : null}

            {safeCategory.key ? (
              <code
                style={{
                  fontSize: 12,
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "#f3f4f6",
                }}
              >
                {safeCategory.key}
              </code>
            ) : null}
          </div>

          {safeCategory.description ? (
            <p style={{ margin: "6px 0 0", color: "#4b5563", fontSize: 13, lineHeight: "18px" }}>
              {safeCategory.description}
            </p>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {onEditCategory ? (
            <button
              type="button"
              onClick={handleEditCategory}
              disabled={!canInteract || savingCategory || deletingCategory}
              style={{ padding: "6px 10px", borderRadius: 10 }}
            >
              Edit
            </button>
          ) : null}

          {onDeleteCategory ? (
            <button
              type="button"
              onClick={handleDeleteCategory}
              disabled={!canInteract || deletingCategory}
              style={{ padding: "6px 10px", borderRadius: 10 }}
            >
              {deletingCategory ? "Deleting..." : "Delete"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Items */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#374151" }}>
            Items ({effectiveItems.length})
          </div>

          {onCreateItem ? (
            <button
              type="button"
              onClick={openCreateItem}
              disabled={!canInteract || isCreatingItem}
              style={{ padding: "6px 10px", borderRadius: 10 }}
            >
              Add item
            </button>
          ) : null}
        </div>

        {isCreatingItem ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#f9fafb" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
                disabled={!canInteract}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />

              <textarea
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Description (optional)"
                disabled={!canInteract}
                rows={3}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={cancelCreateItem}
                  disabled={!canInteract}
                  style={{ padding: "6px 10px", borderRadius: 10 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitCreateItem}
                  disabled={!canInteract || !(newItemName ?? "").trim()}
                  style={{ padding: "6px 10px", borderRadius: 10 }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {effectiveItems.length === 0 ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#f9fafb", color: "#6b7280", fontSize: 13 }}>
            No items yet.
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {effectiveItems.map((item) => {
              const itemId = item?.id ?? "";
              const isDeleting = itemId ? deletingItemSet.has(itemId) : false;
              const isSaving = itemId ? savingItemSet.has(itemId) : false;

              return (
                <li
                  key={itemId || Math.random()}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: "18px" }}>
                        {item?.name || "Untitled item"}
                      </div>

                      {item?.isActive === false ? (
                        <span
                          style={{
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#f3f4f6",
                          }}
                        >
                          Inactive
                        </span>
                      ) : null}

                      {item?.key ? (
                        <code
                          style={{
                            fontSize: 12,
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "#f3f4f6",
                          }}
                        >
                          {item.key}
                        </code>
                      ) : null}
                    </div>

                    {item?.description ? (
                      <div style={{ marginTop: 4, fontSize: 13, color: "#4b5563", lineHeight: "18px" }}>
                        {item.description}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {onEditItem ? (
                      <button
                        type="button"
                        onClick={() => handleEditItem(item)}
                        disabled={!canInteract || isSaving || isDeleting}
                        style={{ padding: "6px 10px", borderRadius: 10 }}
                      >
                        Edit
                      </button>
                    ) : null}

                    {onDeleteItem ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item)}
                        disabled={!canInteract || isDeleting}
                        style={{ padding: "6px 10px", borderRadius: 10 }}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default VportActorMenuCategory;
