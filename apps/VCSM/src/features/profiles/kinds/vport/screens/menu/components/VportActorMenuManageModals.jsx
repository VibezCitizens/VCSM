// src/features/profiles/kinds/vport/ui/menu/VportActorMenuManageModals.jsx

import React from "react";
import { createPortal } from "react-dom";

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
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  const categoryModal = (
    <VportActorMenuCategoryFormModal
      open={!!categoryModalOpen}
      category={categoryModalCategory}
      onSave={onSaveCategory}
      onClose={onCloseCategoryModal}
      saving={!!savingCategory}
    />
  );

  const itemModal = (
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
  );

  const confirmModal = (
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
  );

  return (
    <>
      {modalRoot ? createPortal(categoryModal, modalRoot) : categoryModal}
      {modalRoot ? createPortal(itemModal, modalRoot) : itemModal}
      {modalRoot ? createPortal(confirmModal, modalRoot) : confirmModal}
    </>
  );
}

export default VportActorMenuManageModals;
