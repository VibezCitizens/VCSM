// src/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryItemList.jsx

import React from "react";
import VportActorMenuCategoryItemRow from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryItemRow";

export function VportActorMenuCategoryItemList({
  items = [],
  canInteract,

  emptyBoxStyle,
  itemRowStyle,
  pillStyle,
  codePillStyle,
  btnStyle,
  btnDangerStyle,
  thumbWrapStyle,

  deletingItemSet,
  savingItemSet,

  formatPrice,
  onEditItem,
  onDeleteItem,
} = {}) {
  const safeItems = Array.isArray(items) ? items : [];

  if (!safeItems.length) {
    return <div style={emptyBoxStyle}>No items yet.</div>;
  }

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: "10px 0 0",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {safeItems.map((item) => {
        const itemId = item?.id ?? "";
        const isDeleting = itemId ? deletingItemSet?.has?.(itemId) : false;
        const isSaving = itemId ? savingItemSet?.has?.(itemId) : false;

        return (
          <VportActorMenuCategoryItemRow
            key={itemId || Math.random()}
            item={item}
            itemRowStyle={itemRowStyle}
            thumbWrapStyle={thumbWrapStyle}
            pillStyle={pillStyle}
            codePillStyle={codePillStyle}
            btnStyle={btnStyle}
            btnDangerStyle={btnDangerStyle}
            canInteract={canInteract}
            isDeleting={!!isDeleting}
            isSaving={!!isSaving}
            priceLabel={typeof formatPrice === "function" ? formatPrice(item) : null}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
          />
        );
      })}
    </ul>
  );
}

export default VportActorMenuCategoryItemList;
