// src/features/profiles/kinds/vport/ui/menu/VportActorMenuManagePanel.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";

import useVportActorMenu from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenu";
import useVportActorMenuCategoriesMutations from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations";
import useVportActorMenuItemsMutations from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenuItemsMutations";

import VportActorMenuEmptyState from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuEmptyState";
import VportActorMenuCategory from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuCategory";
import VportActorMenuCategoryFormModal from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryFormModal";
import VportActorMenuItemFormModal from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuItemFormModal";
import VportActorMenuConfirmDeleteModal from "@/features/profiles/kinds/vport/ui/menu/VportActorMenuConfirmDeleteModal";

/**
 * UI: Owner management panel for Vport Actor Menu
 *
 * Contract:
 * - Owns UI state and orchestration of modals
 * - Calls hooks (controllers via hooks)
 * - No DAL / no direct Supabase
 */
export function VportActorMenuManagePanel({
  actorId,
  includeInactive = false,
  className = "",
} = {}) {
  const {
    categories,
    loading: loadingMenu,
    error: menuError,
    refresh,
  } = useVportActorMenu({ actorId, includeInactive });

  // mutations
  const categoriesMut = useVportActorMenuCategoriesMutations({
    actorId,
    onSuccess: async () => {
      await refresh();
    },
  });

  const itemsMut = useVportActorMenuItemsMutations({
    actorId,
    onSuccess: async () => {
      await refresh();
    },
  });

  // modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalCategory, setCategoryModalCategory] = useState(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalItem, setItemModalItem] = useState(null);
  const [itemModalLockCategory, setItemModalLockCategory] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Delete");
  const [confirmDescription, setConfirmDescription] = useState(
    "Are you sure you want to delete this? This action cannot be undone."
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const confirmActionRef = React.useRef(null);

  // track per-item deleting ids (optional)
  const [deletingItemIds, setDeletingItemIds] = useState(() => new Set());

  const hasCategories = (categories ?? []).length > 0;

  const openCreateCategory = useCallback(() => {
    setCategoryModalCategory(null);
    setCategoryModalOpen(true);
  }, []);

  const openEditCategory = useCallback((category) => {
    setCategoryModalCategory(category ?? null);
    setCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback(() => {
    setCategoryModalOpen(false);
    setCategoryModalCategory(null);
  }, []);

  const openCreateItemForCategory = useCallback((categoryId) => {
    setItemModalItem({
      id: null,
      categoryId,
      key: null,
      name: "",
      description: null,
      sortOrder: 0,
      isActive: true,
    });
    setItemModalLockCategory(true);
    setItemModalOpen(true);
  }, []);

  const openEditItem = useCallback((item) => {
    setItemModalItem(item ?? null);
    setItemModalLockCategory(false);
    setItemModalOpen(true);
  }, []);

  const closeItemModal = useCallback(() => {
    setItemModalOpen(false);
    setItemModalItem(null);
    setItemModalLockCategory(false);
  }, []);

  const closeConfirm = useCallback(() => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setConfirmTitle("Delete");
    setConfirmDescription(
      "Are you sure you want to delete this? This action cannot be undone."
    );
    confirmActionRef.current = null;
  }, [confirmLoading]);

  const runConfirm = useCallback(async () => {
    const action = confirmActionRef.current;
    if (!action) return;

    setConfirmLoading(true);
    try {
      await action();
      closeConfirm();
    } finally {
      setConfirmLoading(false);
    }
  }, [closeConfirm]);

  // category save
  const handleSaveCategory = useCallback(
    async (payload) => {
      await categoriesMut.saveCategory(payload);
    },
    [categoriesMut]
  );

  // item save
  const handleSaveItem = useCallback(
    async (payload) => {
      await itemsMut.saveItem(payload);
    },
    [itemsMut]
  );

  // delete category with confirm
  const requestDeleteCategory = useCallback(
    ({ categoryId }) => {
      setConfirmTitle("Delete category");
      setConfirmDescription(
        "Are you sure you want to delete this category? Items under it may become orphaned depending on your database constraints."
      );
      confirmActionRef.current = async () => {
        await categoriesMut.deleteCategory({ categoryId });
      };
      setConfirmOpen(true);
    },
    [categoriesMut]
  );

  // delete item with confirm
  const requestDeleteItem = useCallback(
    ({ itemId }) => {
      setConfirmTitle("Delete item");
      setConfirmDescription(
        "Are you sure you want to delete this item? This action cannot be undone."
      );
      confirmActionRef.current = async () => {
        setDeletingItemIds((prev) => {
          const next = new Set(prev);
          next.add(itemId);
          return next;
        });

        try {
          await itemsMut.deleteItem({ itemId });
        } finally {
          setDeletingItemIds((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        }
      };
      setConfirmOpen(true);
    },
    [itemsMut]
  );

  // derived categories for item modal select
  const categorySelectOptions = useMemo(() => {
    return (categories ?? []).map((c) => ({
      id: c?.id ?? "",
      name: c?.name ?? "Category",
    }));
  }, [categories]);

  // If menu load fails, still render something deterministic
  const errorMessage = menuError?.message ?? null;

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Menu</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Create categories and items. Customers will see only active entries.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={refresh}
            disabled={loadingMenu}
            style={{ padding: "8px 12px", borderRadius: 12 }}
          >
            {loadingMenu ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreateCategory}
            disabled={!actorId || categoriesMut.saving || categoriesMut.deleting}
            style={{ padding: "8px 12px", borderRadius: 12 }}
          >
            Add category
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
            fontSize: 13,
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      {/* Empty state */}
      {!loadingMenu && !hasCategories ? (
        <VportActorMenuEmptyState
          title="No categories yet"
          subtitle="Add your first category to start building your menu."
          actionLabel="Add category"
          onAction={openCreateCategory}
          disabled={!actorId}
        />
      ) : null}

      {/* Categories */}
      {hasCategories ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(categories ?? []).map((cat) => (
            <VportActorMenuCategory
              key={cat?.id ?? Math.random()}
              category={cat}
              includeInactive={includeInactive}
              onEditCategory={openEditCategory}
              onDeleteCategory={requestDeleteCategory}
              onCreateItem={({ categoryId }) => openCreateItemForCategory(categoryId)}
              onEditItem={openEditItem}
              onDeleteItem={requestDeleteItem}
              disabled={!actorId}
              deletingCategory={categoriesMut.deleting}
              savingCategory={categoriesMut.saving}
              deletingItemIds={deletingItemIds}
            />
          ))}
        </div>
      ) : null}

      {/* Category modal */}
      <VportActorMenuCategoryFormModal
        open={categoryModalOpen}
        category={categoryModalCategory}
        onSave={handleSaveCategory}
        onClose={closeCategoryModal}
        saving={categoriesMut.saving}
      />

      {/* Item modal */}
      <VportActorMenuItemFormModal
        open={itemModalOpen}
        item={itemModalItem}
        categories={categorySelectOptions}
        onSave={handleSaveItem}
        onClose={closeItemModal}
        saving={itemsMut.saving}
        lockCategory={itemModalLockCategory}
      />

      {/* Confirm delete */}
      <VportActorMenuConfirmDeleteModal
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={confirmLoading}
        danger={true}
        onConfirm={runConfirm}
        onClose={closeConfirm}
      />
    </div>
  );
}

export default VportActorMenuManagePanel;
