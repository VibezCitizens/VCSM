import { useCallback, useMemo, useRef, useState } from "react";

export function useVportActorMenuManageState({
  actorId,
  categories,
  categoriesMut,
  itemsMut,
  patchMenu,
  refresh,
}) {
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
  const confirmActionRef = useRef(null);
  const [deletingItemIds, setDeletingItemIds] = useState(() => new Set());

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

  const openCreateItemForCategory = useCallback(
    (arg) => {
      const categoryId = typeof arg === "string" ? arg : arg?.categoryId ?? null;
      const prefillName = typeof arg === "object" ? arg?.name ?? "" : "";
      const prefillDescription = typeof arg === "object" ? arg?.description ?? null : null;
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
    setConfirmDescription("Are you sure you want to delete this? This action cannot be undone.");
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
      const isCreate = !payload.itemId;
      if (isCreate && payload.categoryId) {
        const tempId = `_opt_${Date.now()}`;
        const optimisticItem = {
          id: tempId,
          actorId,
          categoryId: payload.categoryId,
          key: payload.key ?? null,
          name: payload.name ?? "",
          description: payload.description ?? null,
          sortOrder: typeof payload.sortOrder === "number" ? payload.sortOrder : 0,
          isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
          priceCents: typeof payload.priceCents === "number" ? payload.priceCents : null,
          currencyCode: payload.currencyCode ?? "USD",
          imageUrl: payload.imageUrl ?? null,
          createdAt: null,
          updatedAt: null,
          _optimistic: true,
        };
        patchMenu((prev) => ({
          ...prev,
          categories: (prev.categories ?? []).map((cat) =>
            cat.id === payload.categoryId
              ? { ...cat, items: [...(cat.items ?? []), optimisticItem] }
              : cat
          ),
        }));
        try {
          await itemsMut.saveItem(payload);
        } catch (err) {
          await refresh();
          throw err;
        }
      } else {
        await itemsMut.saveItem(payload);
      }
    },
    [actorId, itemsMut, patchMenu, refresh]
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
    (arg) => {
      const itemId = arg?.itemId ?? arg?.id ?? null;
      if (!itemId) return;
      setConfirmTitle("Delete item");
      setConfirmDescription("Are you sure you want to delete this item? This action cannot be undone.");
      confirmActionRef.current = async () => {
        setDeletingItemIds((prev) => { const next = new Set(prev); next.add(itemId); return next; });
        try {
          await itemsMut.deleteItem({ itemId });
        } finally {
          setDeletingItemIds((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
        }
      };
      setConfirmOpen(true);
    },
    [itemsMut]
  );

  const categorySelectOptions = useMemo(
    () => (categories ?? []).map((c) => ({ id: c?.id ?? "", name: c?.name ?? "Category" })),
    [categories]
  );

  return {
    categoryModalOpen,
    categoryModalCategory,
    itemModalOpen,
    itemModalItem,
    itemModalLockCategory,
    confirmOpen,
    confirmTitle,
    confirmDescription,
    confirmLoading,
    deletingItemIds,
    categorySelectOptions,
    openCreateCategory,
    openEditCategory,
    closeCategoryModal,
    openCreateItemForCategory,
    openEditItem,
    closeItemModal,
    closeConfirm,
    runConfirm,
    handleSaveCategory,
    handleSaveItem,
    requestDeleteCategory,
    requestDeleteItem,
  };
}
