import { useCallback, useMemo, useState } from "react";
import VportActorMenuCategoryHeader from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryHeader";
import VportActorMenuCategoryInlineCreate from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryInlineCreate";
import VportActorMenuCategoryItemList from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryItemList";
import {
  card,
  codePill,
  emptyBox,
  getBtnDanger,
  getBtn,
  inlineCreateWrap,
  inputStyle,
  itemRow,
  pill,
  thumbWrap,
} from "@/features/profiles/kinds/vport/screens/menu/components/vportActorMenuCategory.styles";
import { formatMenuItemPrice } from "@/features/profiles/kinds/vport/screens/menu/components/vportActorMenuCategory.model";

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
  const btn = getBtn(canInteract);
  const btnDanger = getBtnDanger(canInteract);

  const handleDeleteCategory = useCallback(async () => {
    if (!safeCategory?.id || !onDeleteCategory) return;
    await onDeleteCategory({ categoryId: safeCategory.id });
  }, [safeCategory, onDeleteCategory]);

  const handleEditCategory = useCallback(() => {
    if (!safeCategory?.id || !onEditCategory) return;
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
    if (!safeCategory?.id || !onCreateItem) return;
    const name = (newItemName ?? "").trim();
    if (!name) return;
    const rawPrice = (newItemPrice ?? "").trim();
    const priceNum =
      rawPrice === "" ? null : Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : NaN;
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
  }, [safeCategory, onCreateItem, newItemName, newItemDescription, newItemPrice, cancelCreateItem]);

  if (!safeCategory) return null;

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.80)" }}>
            Items ({effectiveItems.length})
          </div>
          {onCreateItem ? (
            <button type="button" onClick={openCreateItem} disabled={!canInteract || isCreatingItem} style={{ ...btn, opacity: !canInteract || isCreatingItem ? 0.6 : 1 }}>
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
          formatPrice={formatMenuItemPrice}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      </div>
    </section>
  );
}

export default VportActorMenuCategory;
