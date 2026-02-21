// src/features/profiles/kinds/vport/ui/menu/VportActorMenuManagePanel.jsx

import React, { useMemo, useState, useCallback, useRef } from "react";

import useVportActorMenu from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenu";
import useVportActorMenuCategoriesMutations from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations";
import useVportActorMenuItemsMutations from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenuItemsMutations";

import VportActorMenuEmptyState from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuEmptyState";
import VportActorMenuCategory from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategory";

import VportActorMenuManageHeader from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageHeader";
import VportActorMenuManageModals from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageModals";

export function VportActorMenuManagePanel({
  actorId,
  includeInactive = false,
  showHeader = true,
  className = "",
} = {}) {
  const { categories, loading: loadingMenu, error: menuError, refresh } =
    useVportActorMenu({ actorId, includeInactive });

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

  // âœ… FIX: don't access React.useRef without importing React default
  const confirmActionRef = useRef(null);

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

  // accepts either (categoryId) OR ({ categoryId, name, description, price, priceCents })
  const openCreateItemForCategory = useCallback(
    (arg) => {
      const categoryId = typeof arg === "string" ? arg : arg?.categoryId ?? null;

      const prefillName = typeof arg === "object" ? arg?.name ?? "" : "";
      const prefillDescription =
        typeof arg === "object" ? arg?.description ?? null : null;

      const prefillPriceCents =
        typeof arg === "object" && typeof arg?.priceCents === "number"
          ? arg.priceCents
          : typeof arg === "object" && typeof arg?.price_cents === "number"
          ? arg.price_cents
          : null;

      const prefillPrice =
        typeof arg === "object" && typeof arg?.price === "number"
          ? arg.price
          : prefillPriceCents != null
          ? prefillPriceCents / 100
          : null;

      setItemModalItem({
        id: null,
        actorId,
        categoryId,
        key: null,
        name: prefillName,
        description: prefillDescription,
        price: prefillPrice,
        priceCents: prefillPriceCents,
        sortOrder: 0,
        isActive: true,
      });
      setItemModalLockCategory(true);
      setItemModalOpen(true);
    },
    [actorId]
  );

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

  const handleSaveCategory = useCallback(
    async (payload) => {
      await categoriesMut.saveCategory(payload);
    },
    [categoriesMut]
  );

  const handleSaveItem = useCallback(
    async (payload) => {
      await itemsMut.saveItem(payload);
    },
    [itemsMut]
  );

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

  const categorySelectOptions = useMemo(() => {
    return (categories ?? []).map((c) => ({
      id: c?.id ?? "",
      name: c?.name ?? "Category",
    }));
  }, [categories]);

  const errorMessage = menuError?.message ?? null;

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {showHeader ? (
        <VportActorMenuManageHeader
          loading={loadingMenu}
          actorId={actorId}
          onRefresh={refresh}
          onAddCategory={openCreateCategory}
          savingCategory={categoriesMut.saving}
          deletingCategory={categoriesMut.deleting}
        />
      ) : null}

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

      {!loadingMenu && !hasCategories ? (
        <VportActorMenuEmptyState
          title="No categories yet"
          subtitle="Add your first category to start building your menu."
          actionLabel="Add category"
          onAction={openCreateCategory}
          disabled={!actorId}
        />
      ) : null}

      {!loadingMenu && hasCategories ? (
  <VportActorMenuEmptyState
    title="Create a new category"
    subtitle="Keep your VPORT menu structured by grouping items into clear sections."
    actionLabel="Add category"
    onAction={openCreateCategory}
    disabled={!actorId || categoriesMut.saving || categoriesMut.deleting}
  />
) : null}


      {hasCategories ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(categories ?? []).map((cat) => (
            <VportActorMenuCategory
              key={cat?.id ?? Math.random()}
              category={cat}
              includeInactive={includeInactive}
              onEditCategory={openEditCategory}
              onDeleteCategory={requestDeleteCategory}
              onCreateItem={({ categoryId, name, description, price, priceCents }) =>
                openCreateItemForCategory({
                  categoryId,
                  name,
                  description,
                  price,
                  priceCents,
                })
              }
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

      <VportActorMenuManageModals
        actorId={actorId}
        categorySelectOptions={categorySelectOptions}
        categoryModalOpen={categoryModalOpen}
        categoryModalCategory={categoryModalCategory}
        onCloseCategoryModal={closeCategoryModal}
        onSaveCategory={handleSaveCategory}
        savingCategory={categoriesMut.saving}
        itemModalOpen={itemModalOpen}
        itemModalItem={itemModalItem}
        lockCategory={itemModalLockCategory}
        onCloseItemModal={closeItemModal}
        onSaveItem={handleSaveItem}
        savingItem={itemsMut.saving}
        confirmOpen={confirmOpen}
        confirmTitle={confirmTitle}
        confirmDescription={confirmDescription}
        confirmLoading={confirmLoading}
        onConfirm={runConfirm}
        onCloseConfirm={closeConfirm}
      />
    </div>
  );
}

export default VportActorMenuManagePanel;

