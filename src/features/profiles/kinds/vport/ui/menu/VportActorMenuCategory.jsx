// src/features/profiles/kinds/vport/ui/menu/VportActorMenuCategory.jsx

import React, { useMemo, useState, useCallback } from "react";

import VportActorMenuCategoryHeader from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryHeader";
import VportActorMenuCategoryInlineCreate from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryInlineCreate";
import VportActorMenuCategoryItemList from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryItemList";

export function VportActorMenuCategory({
  category,
  items,
  includeInactive = false,

  onEditCategory,
  onDeleteCategory,

  onCreateItem,
  onEditItem,
  onDeleteItem,

  disabled = false,
  deletingCategory = false,
  savingCategory = false,
  deletingItemIds = null,
  savingItemIds = null,

  className = "",
} = {}) {
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

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
    setNewItemPrice("");
  }, [canInteract]);

  const cancelCreateItem = useCallback(() => {
    setIsCreatingItem(false);
    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
  }, []);

  const submitCreateItem = useCallback(async () => {
    if (!safeCategory?.id) return;
    if (!onCreateItem) return;

    const name = (newItemName ?? "").trim();
    if (!name) return;

    const rawPrice = (newItemPrice ?? "").trim();
    const priceNum =
      rawPrice === ""
        ? null
        : Number.isFinite(Number(rawPrice))
        ? Number(rawPrice)
        : NaN;

    if (Number.isNaN(priceNum)) return;

    const priceCents = priceNum == null ? null : Math.round(priceNum * 100);

    await onCreateItem({
      categoryId: safeCategory.id,
      name,
      description: (newItemDescription ?? "").trim() || null,
      price: priceNum,
      priceCents,
    });

    cancelCreateItem();
  }, [
    safeCategory,
    onCreateItem,
    newItemName,
    newItemDescription,
    newItemPrice,
    cancelCreateItem,
  ]);

  const formatPrice = useCallback((it) => {
    const cents =
      typeof it?.priceCents === "number"
        ? it.priceCents
        : typeof it?.price_cents === "number"
        ? it.price_cents
        : null;

    if (cents != null && Number.isFinite(cents)) return `$${(cents / 100).toFixed(2)}`;

    const price =
      typeof it?.price === "number"
        ? it.price
        : typeof it?.price_amount === "number"
        ? it.price_amount
        : null;

    if (price != null && Number.isFinite(price)) return `$${Number(price).toFixed(2)}`;

    return null;
  }, []);

  if (!safeCategory) return null;

  // =========================
  // Vibez theme styles (kept local)
  // =========================
  const card = {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 14,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  const pill = {
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "nowrap",
  };

  const codePill = {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.82)",
  };

  const btn = {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: canInteract ? "pointer" : "not-allowed",
    opacity: canInteract ? 1 : 0.6,
    whiteSpace: "nowrap",
  };

  const btnDanger = {
    ...btn,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.10)",
  };

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    outline: "none",
  };

  const inlineCreateWrap = {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.28)",
  };

  const emptyBox = {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    border: "1px dashed rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.70)",
    fontSize: 13,
  };

  const itemRow = {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "rgba(0,0,0,0.22)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  };

  const thumbWrap = {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.35)",
  };

  return (
    <section className={className} style={card}>
      <VportActorMenuCategoryHeader
        category={safeCategory}
        canInteract={canInteract}
        pillStyle={pill}
        codePillStyle={codePill}
        btnStyle={btn}
        btnDangerStyle={btnDanger}
        deletingCategory={deletingCategory}
        savingCategory={savingCategory}
        onEditCategory={onEditCategory ? handleEditCategory : null}
        onDeleteCategory={onDeleteCategory ? handleDeleteCategory : null}
      />

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.80)" }}>
            Items ({effectiveItems.length})
          </div>

          {onCreateItem ? (
            <button
              type="button"
              onClick={openCreateItem}
              disabled={!canInteract || isCreatingItem}
              style={{
                ...btn,
                opacity: !canInteract || isCreatingItem ? 0.6 : 1,
              }}
            >
              Add item
            </button>
          ) : null}
        </div>

        {isCreatingItem ? (
          <VportActorMenuCategoryInlineCreate
            canInteract={canInteract}
            wrapStyle={inlineCreateWrap}
            btnStyle={btn}
            name={newItemName}
            price={newItemPrice}
            description={newItemDescription}
            setName={setNewItemName}
            setPrice={setNewItemPrice}
            setDescription={setNewItemDescription}
            onCancel={cancelCreateItem}
            onSubmit={submitCreateItem}
            inputStyle={inputStyle}
          />
        ) : null}

        <VportActorMenuCategoryItemList
          items={effectiveItems}
          canInteract={canInteract}
          emptyBoxStyle={emptyBox}
          itemRowStyle={itemRow}
          pillStyle={pill}
          codePillStyle={codePill}
          btnStyle={btn}
          btnDangerStyle={btnDanger}
          thumbWrapStyle={thumbWrap}
          deletingItemSet={deletingItemSet}
          savingItemSet={savingItemSet}
          formatPrice={formatPrice}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      </div>
    </section>
  );
}

export default VportActorMenuCategory;
