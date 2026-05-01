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
} = {}) {
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
  } = useMenuItemForm({ open, mode, item, categories, actorId, saving, titleOverride, onSave, onClose });

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
