import useVportActorMenu from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenu";
import useVportActorMenuCategoriesMutations from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations";
import useVportActorMenuItemsMutations from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenuItemsMutations";
import { invalidateMenuCache } from "@/features/profiles/kinds/vport/lib/menuCache";
import VportActorMenuEmptyState from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuEmptyState";
import VportActorMenuCategory from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategory";
import VportActorMenuManageHeader from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageHeader";
import VportActorMenuManageModals from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageModals";
import { useVportActorMenuManageState } from "@/features/profiles/kinds/vport/screens/menu/hooks/useVportActorMenuManageState";

export function VportActorMenuManagePanel({
  actorId,
  includeInactive = false,
  showHeader = true,
  className = "",
} = {}) {
  const { categories, loading: loadingMenu, error: menuError, refresh, patchMenu } =
    useVportActorMenu({ actorId, includeInactive });

  const categoriesMut = useVportActorMenuCategoriesMutations({
    actorId,
    onSuccess: (result) => {
      if (result?.id) {
        patchMenu((prev) => {
          const already = (prev.categories ?? []).find((c) => c.id === result.id);
          if (already) {
            return {
              ...prev,
              categories: prev.categories.map((c) =>
                c.id === result.id ? { ...result, items: c.items ?? [] } : c
              ),
            };
          }
          return {
            ...prev,
            categories: [...(prev.categories ?? []), { ...result, items: [] }],
          };
        });
      }
      invalidateMenuCache(actorId);
      refresh();
    },
  });

  const itemsMut = useVportActorMenuItemsMutations({
    actorId,
    onSuccess: async () => {
      invalidateMenuCache(actorId);
      await refresh();
    },
  });

  const {
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
  } = useVportActorMenuManageState({
    actorId,
    categories,
    categoriesMut,
    itemsMut,
    patchMenu,
    refresh,
  });

  const hasCategories = (categories ?? []).length > 0;
  const errorMessage = menuError?.message ?? null;

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>
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
                openCreateItemForCategory({ categoryId, name, description, price, priceCents })
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
