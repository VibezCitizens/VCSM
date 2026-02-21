// src/features/profiles/kinds/vport/ui/menu/VportActorMenuManageModals.jsx

import React from "react";

import VportActorMenuCategoryFormModal from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryFormModal";
import VportActorMenuItemFormModal from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal";
import VportActorMenuConfirmDeleteModal from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuConfirmDeleteModal";

export function VportActorMenuManageModals({
  actorId,

  // category modal
  categoryModalOpen,
  categoryModalCategory,
  onSaveCategory,
  onCloseCategoryModal,
  savingCategory,

  // item modal
  itemModalOpen,
  itemModalItem,
  categories,
  categorySelectOptions,
  onSaveItem,
  onCloseItemModal,
  savingItem,
  lockCategory,

  // confirm modal
  confirmOpen,
  confirmTitle,
  confirmDescription,
  confirmLoading,
  onConfirm,
  onCloseConfirm,
} = {}) {
  return (
    <>
      <VportActorMenuCategoryFormModal
        open={!!categoryModalOpen}
        category={categoryModalCategory}
        onSave={onSaveCategory}
        onClose={onCloseCategoryModal}
        saving={!!savingCategory}
      />

      <VportActorMenuItemFormModal
        open={!!itemModalOpen}
        item={itemModalItem}
        categories={categorySelectOptions ?? categories ?? []}
        onSave={onSaveItem}
        onClose={onCloseItemModal}
        saving={!!savingItem}
        lockCategory={!!lockCategory}
        className="vport-menu-item-modal"
        titleOverride={itemModalItem?.id ? "Edit item" : "New item"}
        actorId={actorId}
      />

      <VportActorMenuConfirmDeleteModal
        open={!!confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={!!confirmLoading}
        danger={true}
        onConfirm={onConfirm}
        onClose={onCloseConfirm}
      />
    </>
  );
}

export default VportActorMenuManageModals;
