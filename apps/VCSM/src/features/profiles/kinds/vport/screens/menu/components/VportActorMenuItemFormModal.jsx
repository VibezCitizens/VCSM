import { useCallback, useEffect, useState } from "react";
import {
  overlayStyle,
  cardStyle,
  sectionPad,
  dangerBox,
} from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemForm.styles";
import VportActorMenuItemFormHeader from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormHeader";
import VportActorMenuItemFormFields from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormFields";
import VportActorMenuItemFormActions from "@/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormActions";
import { useMenuItemForm } from "@/features/profiles/kinds/vport/screens/menu/hooks/useMenuItemForm";

export function VportActorMenuItemFormModal({
  open = false,
  mode = null,
  item = null,
  categories = [],
  onSave,
  onClose,
  saving = false,
  titleOverride = null,
  actorId = null,
  disableKey = false,
  lockCategory = false,
  className = "",
  onShareToFeed = null,
} = {}) {
  const [shareToFeed, setShareToFeed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShareToFeed(false);
  }, [open]);

  const wrappedOnSave = useCallback(
    async (payload) => {
      await onSave(payload);
      if (shareToFeed && onShareToFeed) {
        const action = payload.itemId ? "updated" : "added";
        const categoryName =
          Array.isArray(categories)
            ? (categories.find((c) => c.id === payload.categoryId)?.name ?? null)
            : null;
        try {
          await onShareToFeed({ action, subject: "item", subjectName: payload.name, categoryName, imageUrl: payload.imageUrl ?? null });
        } catch {
          // Non-blocking — menu save already committed
        }
      }
    },
    [onSave, shareToFeed, onShareToFeed, categories]
  );

  const {
    effectiveMode,
    safeCategories,
    modalTitle,
    canSubmit,
    uploadingImage,
    error,
    categoryIdValue,
    keyValue,
    nameValue,
    descriptionValue,
    priceValue,
    sortOrderValue,
    isActiveValue,
    imageUrlValue,
    imagePreviewUrl,
    handleClose,
    handlePickImage,
    handleClearImage,
    handleSubmit,
    setCategoryIdValue,
    setKeyValue,
    setNameValue,
    setPriceValue,
    setDescriptionValue,
    setSortOrderValue,
    setIsActiveValue,
  } = useMenuItemForm({ open, mode, item, categories, actorId, saving, titleOverride, onSave: wrappedOnSave, onClose });

  if (!open) return null;

  const disabled = saving || uploadingImage;

  return (
    <div
      className={className}
      role="dialog"
      aria-modal="true"
      style={overlayStyle}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={cardStyle}>
        <VportActorMenuItemFormHeader
          title={modalTitle}
          onClose={handleClose}
          disabled={disabled}
        />

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}
        >
          <div style={sectionPad}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <VportActorMenuItemFormFields
                safeCategories={safeCategories}
                lockCategory={lockCategory}
                disableKey={disableKey}
                uploadingImage={uploadingImage}
                disabled={disabled}
                categoryIdValue={categoryIdValue}
                keyValue={keyValue}
                nameValue={nameValue}
                priceValue={priceValue}
                descriptionValue={descriptionValue}
                sortOrderValue={sortOrderValue}
                isActiveValue={isActiveValue}
                imagePreviewUrl={imagePreviewUrl}
                imageUrlValue={imageUrlValue}
                onChangeCategoryId={(e) => setCategoryIdValue(e.target.value)}
                onChangeKey={(e) => setKeyValue(e.target.value)}
                onChangeName={(e) => setNameValue(e.target.value)}
                onChangePrice={(e) => setPriceValue(e.target.value)}
                onChangeDescription={(e) => setDescriptionValue(e.target.value)}
                onChangeSortOrder={(e) => setSortOrderValue(e.target.value)}
                onChangeIsActive={(e) => setIsActiveValue(e.target.checked)}
                onPickImage={handlePickImage}
                onClearImage={handleClearImage}
              />

              {error ? (
                <div style={dangerBox}>{error?.message ?? "Something went wrong"}</div>
              ) : null}

              <div style={{ height: 10 }} />
            </div>
          </div>

          {onShareToFeed && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px 16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={shareToFeed}
                  onChange={(e) => setShareToFeed(e.target.checked)}
                  disabled={saving}
                  style={{ appearance: "auto", WebkitAppearance: "checkbox", width: 16, height: 16, margin: 0, accentColor: "#38bdf8" }}
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>Share this update to my feed</span>
              </label>
            </div>
          )}

          <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.10)", background: "rgba(17, 17, 17, 0.92)", paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
            <VportActorMenuItemFormActions
              canSubmit={canSubmit}
              saving={saving}
              uploadingImage={uploadingImage}
              effectiveMode={effectiveMode}
              onCancel={handleClose}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default VportActorMenuItemFormModal;
